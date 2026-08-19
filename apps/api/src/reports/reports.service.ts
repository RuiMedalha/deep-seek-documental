import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDocuments,
      pendingDocuments,
      monthlyDocuments,
      totalExpenses,
      monthlyExpenses,
      totalInvoices,
      pendingInvoices,
      totalContacts,
      totalDeals,
      wonDeals,
      pendingActivities,
      recentActivity,
    ] = await Promise.all([
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.document.count({ where: { tenantId, status: { in: ['NOVO', 'EM_REVISAO'] } } }),
      this.prisma.document.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
      this.prisma.expense.count({ where: { tenantId } }),
      this.prisma.expense.aggregate({
        where: { tenantId, date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({ where: { tenantId } }),
      this.prisma.invoice.count({ where: { tenantId, status: { in: ['pendente', 'vencida'] } } }),
      this.prisma.crmContact.count({ where: { tenantId, isActive: true } }),
      this.prisma.deal.count({ where: { tenantId, stage: { not: 'LOST' } } }),
      this.prisma.deal.count({ where: { tenantId, stage: 'WON' } }),
      this.prisma.activity.count({ where: { tenantId, completedAt: null } }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return {
      documents: {
        total: totalDocuments,
        pending: pendingDocuments,
        thisMonth: monthlyDocuments,
      },
      expenses: {
        total: totalExpenses,
        thisMonth: monthlyExpenses._sum.amount || 0,
      },
      invoices: {
        total: totalInvoices,
        pending: pendingInvoices,
      },
      crm: {
        contacts: totalContacts,
        activeDeals: totalDeals,
        wonDeals,
        pendingActivities,
      },
      recentActivity,
    };
  }

  async getProfitLossReport(tenantId: string, startDate: Date, endDate: Date) {
    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { tenantId, date: { gte: startDate, lte: endDate } },
      }),
      this.prisma.expense.findMany({
        where: { tenantId, date: { gte: startDate, lte: endDate } },
      }),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      },
      period: { startDate, endDate },
    };
  }
}