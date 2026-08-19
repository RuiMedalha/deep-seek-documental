import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPayment(tenantId: string, userId: string, dto: any) {
    return this.prisma.paymentSchedule.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || 'EUR',
        dueDate: new Date(dto.dueDate),
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null,
        category: dto.category,
        paymentMethod: dto.paymentMethod,
        recurring: dto.recurring || false,
        recurrenceType: dto.recurrenceType,
        recurrenceInterval: dto.recurrenceInterval,
        invoiceId: dto.invoiceId,
        crmContactId: dto.contactId,
        createdById: userId,
        status: dto.paymentDate ? 'PAID' : 'PENDING',
      },
    });
  }

  async getPayments(tenantId: string, filters?: any) {
    const where: any = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {};
      if (filters?.startDate) where.dueDate.gte = new Date(filters.startDate);
      if (filters?.endDate) where.dueDate.lte = new Date(filters.endDate);
    }

    const [payments, total] = await Promise.all([
      this.prisma.paymentSchedule.findMany({
        where,
        include: {
          invoice: { select: { number: true, supplier: true } },
          crmContact: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        skip: ((filters?.page || 1) - 1) * (filters?.limit || 20),
        take: filters?.limit || 20,
      }),
      this.prisma.paymentSchedule.count({ where }),
    ]);

    return { payments, total };
  }

  async getCalendarEvents(tenantId: string, month: Date) {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    const payments = await this.prisma.paymentSchedule.findMany({
      where: {
        tenantId,
        OR: [
          { dueDate: { gte: startDate, lte: endDate } },
          { paymentDate: { gte: startDate, lte: endDate } },
        ],
        status: { not: 'CANCELLED' },
      },
      orderBy: { dueDate: 'asc' },
    });

    return payments.map(payment => ({
      id: payment.id,
      date: payment.dueDate,
      title: payment.title,
      amount: Number(payment.amount),
      status: payment.status,
      type: Number(payment.amount) >= 0 ? 'income' : 'expense',
      category: payment.category,
      isPaid: payment.status === 'PAID',
      isOverdue: payment.status === 'OVERDUE' || 
        (payment.status === 'PENDING' && payment.dueDate < new Date()),
    }));
  }

  async getUpcomingPayments(tenantId: string, days = 7) {
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.paymentSchedule.findMany({
      where: {
        tenantId,
        dueDate: { gte: now, lte: endDate },
        status: { in: ['PENDING', 'SCHEDULED'] },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        invoice: { select: { number: true } },
      },
    });
  }

  async getOverduePayments(tenantId: string) {
    return this.prisma.paymentSchedule.findMany({
      where: {
        tenantId,
        dueDate: { lt: new Date() },
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markAsPaid(tenantId: string, paymentId: string, userId: string) {
    const payment = await this.prisma.paymentSchedule.findFirst({
      where: { id: paymentId, tenantId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    const updated = await this.prisma.paymentSchedule.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
      },
    });

    // Atualizar fatura se existir
    if (payment.invoiceId) {
      await this.prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'pago' },
      });
    }

    return updated;
  }

  async cancelPayment(tenantId: string, paymentId: string) {
    return this.prisma.paymentSchedule.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });
  }
}