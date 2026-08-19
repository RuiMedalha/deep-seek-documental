import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(file: Express.Multer.File, user: any, metadata?: any) {
    if (!file) {
      throw new BadRequestException('Ficheiro não fornecido');
    }

    // Calcular hash do ficheiro para detecção de duplicados
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Verificar duplicados
    const duplicate = await this.prisma.document.findFirst({
      where: {
        tenantId: user.tenantId,
        fileHash,
        status: { not: 'ARQUIVADO' },
      },
    });

    if (duplicate) {
      // Remover ficheiro duplicado
      fs.unlinkSync(file.path);
      throw new BadRequestException('Documento duplicado já existe');
    }

    // Criar documento
    const document = await this.prisma.document.create({
      data: {
        tenantId: user.tenantId,
        fileName: file.originalname,
        filePath: file.path,
        fileHash,
        mimeType: file.mimetype,
        size: file.size,
        origin: metadata?.origin || 'UPLOAD',
        type: metadata?.type || 'OUTRO',
        status: 'NOVO',
        uploadedById: user.id,
        tags: metadata?.tags || [],
      },
    });

    // Registrar auditoria
    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'UPLOAD_DOCUMENT',
        entity: 'Document',
        entityId: document.id,
        metadata: {
          fileName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
      },
    });

    return document;
  }

  async getInbox(tenantId: string, filters?: any) {
    const where: any = {
      tenantId,
      status: { in: ['NOVO', 'PROCESSADO', 'EM_REVISAO'] },
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { fileName: { contains: filters.search, mode: 'insensitive' } },
        { supplierCustomer: { contains: filters.search, mode: 'insensitive' } },
        { nif: { contains: filters.search } },
      ];
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((filters?.page || 1) - 1) * (filters?.limit || 20),
        take: filters?.limit || 20,
        include: {
          uploadedBy: {
            select: { name: true, email: true },
          },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { documents, total, page: filters?.page || 1, limit: filters?.limit || 20 };
  }

  async getDocument(id: string, tenantId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
        invoices: true,
        expenses: true,
        paymentSchedules: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    return document;
  }

  async updateDocument(id: string, tenantId: string, data: any, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        type: data.type,
        status: data.status,
        supplierCustomer: data.supplierCustomer,
        nif: data.nif,
        documentDate: data.documentDate ? new Date(data.documentDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        total: data.total,
        iva: data.iva,
        currency: data.currency,
        tags: data.tags,
        finalFolder: data.finalFolder,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'UPDATE_DOCUMENT',
        entity: 'Document',
        entityId: id,
        metadata: { changes: data },
      },
    });

    return updated;
  }

  async deleteDocument(id: string, tenantId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Remover ficheiro
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await this.prisma.document.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'DELETE_DOCUMENT',
        entity: 'Document',
        entityId: id,
      },
    });

    return { success: true };
  }

  async getDocumentStats(tenantId: string) {
    const [total, novo, processado, emRevisao, arquivado] = await Promise.all([
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.document.count({ where: { tenantId, status: 'NOVO' } }),
      this.prisma.document.count({ where: { tenantId, status: 'PROCESSADO' } }),
      this.prisma.document.count({ where: { tenantId, status: 'EM_REVISAO' } }),
      this.prisma.document.count({ where: { tenantId, status: 'ARQUIVADO' } }),
    ]);

    return {
      total,
      porEstado: {
        novo,
        processado,
        emRevisao,
        arquivado,
      },
    };
  }
}