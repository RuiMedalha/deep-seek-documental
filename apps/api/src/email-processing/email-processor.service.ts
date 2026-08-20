import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { OcrService } from '../ocr/ocr.service';
import { QrCodeAtService } from '../ocr/qrcode-at.service';

@Injectable()
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private ocrService: OcrService,
    private qrCodeAtService: QrCodeAtService,
  ) {}

  /**
   * Configurar receção de emails
   */
  async configureEmailReceiving(tenantId: string, config: any) {
    return this.prisma.integration.upsert({
      where: {
        tenantId_type: {
          tenantId,
          type: 'email_receiving',
        },
      },
      create: {
        tenantId,
        type: 'email_receiving',
        credentials: {
          host: config.host,
          port: config.port || 993,
          user: config.user,
          password: config.password,
        },
        config: {
          autoProcess: config.autoProcess !== false,
          folder: config.folder || 'INBOX',
        },
        active: true,
      },
      update: {
        credentials: {
          host: config.host,
          port: config.port || 993,
          user: config.user,
          password: config.password,
        },
        config: {
          autoProcess: config.autoProcess !== false,
          folder: config.folder || 'INBOX',
        },
        active: true,
      },
    });
  }

  /**
   * Processa email com fatura
   */
  async processInvoiceEmail(tenantId: string, emailData: any) {
    const { subject, from, text, html, attachments } = emailData;

    this.logger.log(`Processando email: ${subject}`);

    // Detetar fonte
    const source = this.detectEmailSource(subject, from, text, html);

    // Extrair links
    const links = this.extractInvoiceLinks(html || text || '');

    const processedAttachments = [];
    const processedLinks = [];

    // Processar anexos
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.contentType === 'application/pdf' || attachment.contentType?.startsWith('image/')) {
          const document = await this.createDocumentFromBuffer(
            tenantId,
            attachment.content,
            attachment.filename,
            attachment.contentType,
            source,
          );
          processedAttachments.push({
            fileName: attachment.filename,
            documentId: document.id,
            status: 'CREATED',
          });
        }
      }
    }

    // Processar links
    for (const link of links) {
      try {
        const pdfBuffer = await this.downloadPdfFromLink(link);
        const fileName = this.extractFileNameFromLink(link);
        const document = await this.createDocumentFromBuffer(
          tenantId,
          pdfBuffer,
          fileName,
          'application/pdf',
          source,
        );
        processedLinks.push({
          link,
          documentId: document.id,
          status: 'DOWNLOADED',
        });
      } catch (error) {
        this.logger.error(`Erro ao processar link ${link}:`, error);
        processedLinks.push({
          link,
          status: 'ERROR',
          error: error.message,
        });
      }
    }

    return {
      success: true,
      subject,
      source,
      attachments: processedAttachments,
      links: processedLinks,
    };
  }

  /**
   * Processa email com callback de pagamento (Ifthenpay)
   */
  async processPaymentEmail(tenantId: string, emailData: any) {
    const { subject, text, html } = emailData;
    const combined = `${subject} ${text} ${html}`;

    // Detetar se é pagamento Ifthenpay
    if (combined.toLowerCase().includes('ifthenpay')) {
      return this.processIfthenpayEmail(tenantId, combined);
    }

    return { success: false, reason: 'Não é email de pagamento' };
  }

   private async processIfthenpayEmail(tenantId: string, content: string) {
    const paymentData = {
      entity: this.extractField(content, /entidade\s*:?\s*(\d+)/i),
      reference: this.extractField(content, /refer[eê]ncia\s*:?\s*(\d+)/i),
      amount: this.extractField(content, /valor\s*:?\s*(\d+[.,]\d+)/i),
      date: new Date(),
    };

    return {
      success: true,
      paymentData,
    };
  }

  private detectEmailSource(subject: string, from: string, text: string, html: string): string {
    const combined = `${subject} ${from} ${text} ${html}`.toLowerCase();
    if (combined.includes('moloni')) return 'MOLONI';
    if (combined.includes('toconline')) return 'TOCONLINE';
    if (combined.includes('ifthenpay')) return 'IFTHENPAY';
    if (combined.includes('fatura') || combined.includes('invoice')) return 'INVOICE';
    return 'UNKNOWN';
  }

  private extractInvoiceLinks(html: string): string[] {
    const links: string[] = [];
    const urlRegex = /https?:\/\/[^\s<>"]+/g;
    const matches = html.match(urlRegex) || [];

    for (const link of matches) {
      if (
        link.toLowerCase().includes('fatura') ||
        link.toLowerCase().includes('invoice') ||
        link.toLowerCase().includes('pdf') ||
        link.toLowerCase().includes('download') ||
        link.toLowerCase().includes('moloni') ||
        link.toLowerCase().includes('toconline')
      ) {
        links.push(link);
      }
    }

    return links;
  }

  private async downloadPdfFromLink(link: string): Promise<Buffer> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(link, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }),
      );
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Erro ao descarregar PDF:`, error);
      throw error;
    }
  }

  private extractFileNameFromLink(link: string): string {
    const url = new URL(link);
    const parts = url.pathname.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.includes('.pdf') ? lastPart : `fatura_${Date.now()}.pdf`;
  }

  private async createDocumentFromBuffer(
    tenantId: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    source: string,
  ) {
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Verificar duplicado
    const existing = await this.prisma.document.findFirst({
      where: { tenantId, fileHash },
    });

    if (existing) {
      return existing;
    }

    // Guardar ficheiro
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, `${Date.now()}_${fileName}`);
    fs.writeFileSync(filePath, buffer);

    // Criar documento
    const document = await this.prisma.document.create({
      data: {
        tenantId,
        fileName,
        filePath,
        fileHash,
        mimeType,
        size: buffer.length,
        origin: 'EMAIL',
        type: 'FATURA_RECEBIDA',
        status: 'NOVO',
        uploadedById: 'system',
        metadata: {
          source,
          receivedViaEmail: true,
          receivedAt: new Date(),
        },
      },
    });

    // Processar OCR automaticamente
    try {
      await this.ocrService.processDocumentWithOcr(document.id);
    } catch (error) {
      this.logger.error(`Erro no OCR do documento ${document.id}:`, error);
    }

    return document;
  }

  private extractField(content: string, regex: RegExp): string | null {
    const match = content.match(regex);
    return match ? match[1] : null;
  }
}