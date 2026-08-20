import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private prisma: PrismaService) {}

  async processDocumentWithOcr(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { tenant: true },
    });

    if (!document) {
      throw new Error('Documento não encontrado');
    }

    this.logger.log(`Processando OCR para documento ${documentId}`);

    let extractedText = '';

    if (document.mimeType === 'application/pdf') {
      extractedText = await this.extractTextFromPdf(document.filePath);
    } else if (document.mimeType.startsWith('image/')) {
      extractedText = await this.extractTextFromImage(document.filePath);
    }

    const extractedData = this.parseInvoiceData(extractedText);
    const entity = await this.identifyEntity(document.tenantId, extractedData);
    const documentType = this.detectDocumentType(extractedText, extractedData);

    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        type: documentType,
        status: 'PROCESSADO',
        supplierCustomer: extractedData.supplier || entity?.name,
        nif: extractedData.nif,
        documentDate: extractedData.documentDate,
        dueDate: extractedData.dueDate,
        total: extractedData.total,
        iva: extractedData.iva,
        currency: extractedData.currency || 'EUR',
        metadata: {
          ocrText: extractedText,
          extractedData,
          confidence: extractedData.confidence,
          processingMethod: 'OCR',
          processedAt: new Date(),
        },
      },
    });

    return {
      documentId,
      extractedData,
      entity,
      documentType,
      confidence: extractedData.confidence,
    };
  }

  private async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      const pdfBuffer = fs.readFileSync(filePath);
      // Mock: em produção usar pdf-parse
      const text = pdfBuffer.toString('utf-8');
      return text.length > 50 ? text : '';
    } catch (error) {
      this.logger.error('Erro ao extrair texto do PDF:', error);
      return '';
    }
  }

  private async extractTextFromImage(filePath: string): Promise<string> {
    try {
      // Mock: em produção usar Tesseract
      const imageBuffer = fs.readFileSync(filePath);
      return '';
    } catch (error) {
      this.logger.error('Erro ao extrair texto da imagem:', error);
      return '';
    }
  }

  private parseInvoiceData(text: string): any {
    const data: any = { confidence: 0 };

    if (!text || text.trim().length === 0) {
      return data;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // NIF
    const nifRegex = /\b\d{9}\b/g;
    const nifs = text.match(nifRegex);
    if (nifs && nifs.length > 0) {
      data.nif = nifs[0];
      data.confidence += 0.15;
    }

    // Datas
    const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g;
    const dates = text.match(dateRegex);
    if (dates && dates.length > 0) {
      data.documentDate = this.parseDate(dates[0]);
      if (dates.length > 1) {
        data.dueDate = this.parseDate(dates[1]);
      }
      data.confidence += 0.1;
    }

    // Total
    const totalPatterns = [
      /total\s*(?:a\s*pagar)?\s*:?\s*(\d+[.,]\d+)/i,
      /montante\s*total\s*:?\s*(\d+[.,]\d+)/i,
      /valor\s*total\s*:?\s*(\d+[.,]\d+)/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.total = this.parseAmount(match[1]);
        data.confidence += 0.2;
        break;
      }
    }

    // IVA
    const ivaPatterns = [
      /iva\s*(?:\(?\d+%\)?)?\s*:?\s*(\d+[.,]\d+)/i,
      /imposto\s*:?\s*(\d+[.,]\d+)/i,
    ];

    for (const pattern of ivaPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.iva = this.parseAmount(match[1]);
        data.confidence += 0.1;
        break;
      }
    }

    // Fornecedor (primeiras linhas)
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      if (
        line.toLowerCase().includes('fatura') ||
        line.toLowerCase().includes('factura') ||
        line.toLowerCase().includes('invoice') ||
        line.toLowerCase().includes('data') ||
        line.toLowerCase().includes('nif') ||
        line.toLowerCase().includes('total') ||
        /^\d{9}$/.test(line) ||
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(line)
      ) {
        continue;
      }
      if (line.length > 3) {
        data.supplier = line;
        data.confidence += 0.1;
        break;
      }
    }

    // Número da fatura
    const invoiceNumberPatterns = [
      /fatura\s*(?:n[ºo])?\s*:?\s*([A-Z0-9\-\/]+)/i,
      /\b(?:FT|FS|FR|NC|ND)\s*(\d+)\b/i,
    ];

    for (const pattern of invoiceNumberPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.invoiceNumber = match[1];
        data.confidence += 0.1;
        break;
      }
    }

    // IBAN
    const ibanRegex = /\bPT\d{23}\b/i;
    const ibanMatch = text.match(ibanRegex);
    if (ibanMatch) {
      data.iban = ibanMatch[0];
      data.confidence += 0.05;
    }

    data.confidence = Math.min(data.confidence, 1);
    return data;
  }

    private async identifyEntity(tenantId: string, data: any): Promise<any> {
    return null;
  }

  private detectDocumentType(text: string, data: any): any {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('fatura') || lowerText.includes('factura') || data.invoiceNumber) {
      if (lowerText.includes('recibo')) return 'RECIBO';
      return 'FATURA_RECEBIDA';
    }
    if (lowerText.includes('recibo')) return 'RECIBO';
    if (lowerText.includes('comprovativo')) return 'COMPROVATIVO';
    if (lowerText.includes('encomenda')) return 'ENCOMENDA';
    return 'OUTRO';
  }

  private parseDate(dateStr: string): Date {
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(dateStr);
  }

  private parseAmount(value: string): number {
    if (value.includes(',') && value.includes('.')) {
      if (value.lastIndexOf(',') > value.lastIndexOf('.')) {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
      }
      return parseFloat(value.replace(/,/g, ''));
    }
    if (value.includes(',')) {
      return parseFloat(value.replace(',', '.'));
    }
    return parseFloat(value);
  }
}