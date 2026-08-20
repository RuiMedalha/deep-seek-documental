import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(private prisma: PrismaService) {}

  async processScannedDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Documento não encontrado');
    }

    return {
      documentId,
      source: 'scanner',
      quality: 'high',
      processed: true,
    };
  }

  async detectSource(filePath: string): Promise<'scanner' | 'camera' | 'unknown'> {
    return 'scanner';
  }
}