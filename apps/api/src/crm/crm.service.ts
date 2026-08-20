import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async createContact(tenantId: string, userId: string, data: any) {
    const existing = await this.prisma.crmContact.findFirst({
      where: {
        tenantId,
        OR: [
          { email: data.email },
          { nif: data.nif },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Contacto já existe');
    }

    const contact = await this.prisma.crmContact.create({
      data: {
        tenantId,
        type: data.type || 'COMPANY',
        name: data.name,
        nif: data.nif,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country || 'Portugal',
        website: data.website,
        industry: data.industry,
        notes: data.notes,
        tags: data.tags || [],
      },
    });

    await this.prisma.activity.create({
      data: {
        tenantId,
        contactId: contact.id,
        type: 'NOTE',
        subject: 'Contacto criado',
        description: 'Contacto criado no sistema',
        createdById: userId,
      },
    });

    return contact;
  }

  async getContacts(tenantId: string, filters?: any) {
    const where: any = { tenantId, isActive: true };

    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { nif: { contains: filters.search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      this.prisma.crmContact.findMany({
        where,
        include: {
          contactPersons: true,
          deals: { where: { stage: { not: 'LOST' } }, take: 5 },
          _count: { select: { documents: true, invoices: true, activities: true, deals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((filters?.page || 1) - 1) * (filters?.limit || 20),
        take: filters?.limit || 20,
      }),
      this.prisma.crmContact.count({ where }),
    ]);

    return { contacts, total, page: filters?.page || 1, limit: filters?.limit || 20 };
  }

  async getContactDetails(tenantId: string, contactId: string) {
    const contact = await this.prisma.crmContact.findFirst({
      where: { id: contactId, tenantId },
      include: {
        contactPersons: true,
        deals: true,
        documents: { take: 10, orderBy: { createdAt: 'desc' } },
        invoices: { take: 10, orderBy: { date: 'desc' } },
        payments: { take: 10, orderBy: { dueDate: 'desc' } },
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true } } },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contacto não encontrado');
    }

    return contact;
  }

  async createDeal(tenantId: string, userId: string, data: any) {
    const deal = await this.prisma.deal.create({
      data: {
        tenantId,
        contactId: data.contactId,
        title: data.title,
        value: data.value,
        stage: data.stage || 'LEAD',
        probability: data.probability || 20,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        createdById: userId,
      },
    });

    await this.prisma.activity.create({
      data: {
        tenantId,
        contactId: data.contactId,
        dealId: deal.id,
        type: 'NOTE',
        subject: 'Oportunidade criada',
        createdById: userId,
      },
    });

    return deal;
  }

  async getDeals(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    if (filters?.stage) where.stage = filters.stage;
    if (filters?.contactId) where.contactId = filters.contactId;

    return this.prisma.deal.findMany({
      where,
      include: {
        contact: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDealStage(tenantId: string, dealId: string, stage: string, userId: string) {
    const updateData: any = { stage: stage as any };
    if (stage === 'WON') { updateData.wonAt = new Date(); updateData.probability = 100; }
    if (stage === 'LOST') { updateData.lostAt = new Date(); updateData.probability = 0; }

    return this.prisma.deal.update({
      where: { id: dealId },
      data: updateData,
    });
  }

  async createActivity(tenantId: string, userId: string, data: any) {
    return this.prisma.activity.create({
      data: {
        tenantId,
        ...data,
        createdById: userId,
      },
    });
  }

  async getPendingActivities(tenantId: string, userId: string) {
    return this.prisma.activity.findMany({
      where: {
        tenantId,
        completedAt: null,
        OR: [
          { assignedToId: userId },
          { createdById: userId },
        ],
      },
      include: {
        contact: { select: { name: true } },
        deal: { select: { title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async updateContact(tenantId: string, contactId: string, data: any) {
    return this.prisma.crmContact.update({
      where: { id: contactId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteContact(tenantId: string, contactId: string) {
    return this.prisma.crmContact.update({
      where: { id: contactId },
      data: { isActive: false },
    });
  }

  async completeActivity(tenantId: string, activityId: string) {
    return this.prisma.activity.update({
      where: { id: activityId },
      data: { completedAt: new Date() },
    });
  }

  async getPipelineStats(tenantId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId, stage: { not: 'LOST' } },
      select: { stage: true, value: true },
    });

    const stats: any = {};
    ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'].forEach(stage => {
      stats[stage] = { count: 0, value: 0 };
    });

    deals.forEach(deal => {
      if (stats[deal.stage]) {
        stats[deal.stage].count++;
        stats[deal.stage].value += Number(deal.value);
      }
    });

    return stats;
  }
}