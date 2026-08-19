import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async configure(tenantId: string, type: string, credentials: any) {
    return this.prisma.integration.upsert({
      where: {
        tenantId_type: { tenantId, type },
      },
      create: {
        tenantId,
        type,
        credentials,
        active: true,
      },
      update: {
        credentials,
        active: true,
      },
    });
  }

  async getIntegrations(tenantId: string) {
    return this.prisma.integration.findMany({
      where: { tenantId },
      select: {
        id: true,
        type: true,
        active: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async disableIntegration(tenantId: string, type: string) {
    return this.prisma.integration.update({
      where: {
        tenantId_type: { tenantId, type },
      },
      data: { active: false },
    });
  }

  // TOConline
  async sendToToconline(tenantId: string, documentId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { tenantId_type: { tenantId, type: 'toconline' } },
    });

    if (!integration || !integration.active) {
      throw new BadRequestException('TOConline não configurado');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new BadRequestException('Documento não encontrado');
    }

    // Mock: Simular envio
    return {
      success: true,
      externalId: `TOC-${Date.now()}`,
      documentId,
      sentAt: new Date(),
      status: 'sent',
    };
  }

  // WooCommerce
  async syncWooCommerce(tenantId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { tenantId_type: { tenantId, type: 'woocommerce' } },
    });

    if (!integration || !integration.active) {
      throw new BadRequestException('WooCommerce não configurado');
    }

    // Mock: Simular sincronização
    const mockOrders = [
      { id: 1001, number: 'WC-1001', total: '150.00', status: 'processing' },
      { id: 1002, number: 'WC-1002', total: '320.50', status: 'completed' },
    ];

    return {
      synced: mockOrders.length,
      orders: mockOrders,
      timestamp: new Date(),
    };
  }

  // Ifthenpay
  async handleIfthenpayCallback(tenantId: string, payload: any) {
    return {
      success: true,
      payment: {
        id: payload.id || `PAY-${Date.now()}`,
        amount: payload.amount,
        reference: payload.reference,
        entity: payload.entity,
        date: new Date(),
        status: 'confirmed',
      },
    };
  }

  // Moloni
  async syncMoloni(tenantId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { tenantId_type: { tenantId, type: 'moloni' } },
    });

    if (!integration || !integration.active) {
      throw new BadRequestException('Moloni não configurado');
    }

    // Mock: Simular sincronização
    return {
      customers: 25,
      suppliers: 15,
      invoices: 42,
      documents: 38,
      timestamp: new Date(),
    };
  }
}