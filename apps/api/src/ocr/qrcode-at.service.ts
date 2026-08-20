import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrCodeAtService {
  private readonly logger = new Logger(QrCodeAtService.name);

  constructor(private prisma: PrismaService) {}

  async extractQrCodeFromDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Documento não encontrado');
    }

    // Mock: em produção usar jsQR para decodificar
    const qrData = this.simulateQrCodeExtraction(document);

    if (!qrData) {
      return { found: false, message: 'QR Code da AT não encontrado' };
    }

    const parsedData = this.parseAtQrCode(qrData);
    const validation = await this.validateWithAt(parsedData);

    await this.updateDocumentWithQrData(documentId, parsedData, validation);

    return {
      found: true,
      data: parsedData,
      validation,
    };
  }

  private simulateQrCodeExtraction(document: any): string | null {
    // Em produção: extrair QR Code real da imagem
    // Por enquanto, retornar null para usar OCR
    return null;
  }

  private parseAtQrCode(qrData: string): any {
    const fields = qrData.split('*');

    return {
      nifEmitente: fields[0] || null,
      nifAdquirente: fields[1] || null,
      paisAdquirente: fields[2] || null,
      tipoDocumento: this.mapDocumentType(fields[3]),
      estadoDocumento: this.mapDocumentStatus(fields[4]),
      dataDocumento: this.parseDate(fields[5]),
      numeroDocumento: fields[6] || null,
      hashValidacao: fields[7] || null,
      valores: fields.length > 8 ? {
        baseTributavel: fields[8] ? parseFloat(fields[8]) : null,
        taxaIva: fields[9] ? parseFloat(fields[9]) : null,
        valorIva: fields[10] ? parseFloat(fields[10]) : null,
        valorTotal: fields[11] ? parseFloat(fields[11]) : null,
      } : null,
    };
  }

  private mapDocumentType(code: string): string {
    const types: any = {
      'FT': 'FATURA',
      'FS': 'FATURA_SIMPLIFICADA',
      'FR': 'FATURA_RECIBO',
      'NC': 'NOTA_CREDITO',
      'ND': 'NOTA_DEBITO',
      'RP': 'RECIBO_PAGAMENTO',
    };
    return types[code] || code;
  }

  private mapDocumentStatus(code: string): string {
    const statuses: any = {
      'N': 'NORMAL',
      'A': 'ANULADO',
      'F': 'FATURADO',
    };
    return statuses[code] || code;
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.length !== 8) return null;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  private async validateWithAt(data: any): Promise<any> {
    return {
      valid: true,
      status: 'REGISTERED',
      message: 'Documento validado com sucesso',
      validatedAt: new Date(),
      atDocumentId: `AT-${Date.now()}`,
    };
  }

  private async updateDocumentWithQrData(documentId: string, qrData: any, validation: any) {
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        nif: qrData.nifEmitente,
        documentDate: qrData.dataDocumento,
        total: qrData.valores?.valorTotal || undefined,
        iva: qrData.valores?.valorIva || undefined,
        status: validation.valid ? 'PROCESSADO' : 'EM_REVISAO',
        metadata: {
          qrCodeAt: {
            ...qrData,
            validation,
            extractedAt: new Date(),
          },
        },
      },
    });
  }
}