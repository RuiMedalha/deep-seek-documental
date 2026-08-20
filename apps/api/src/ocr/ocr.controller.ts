import { Controller, Post, Param, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OcrService } from './ocr.service';
import { ScannerService } from './scanner.service';
import { QrCodeAtService } from './qrcode-at.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('ocr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(
    private ocrService: OcrService,
    private scannerService: ScannerService,
    private qrCodeAtService: QrCodeAtService,
    private prisma: PrismaService,
  ) {}

  @Post(':documentId/process')
  @ApiOperation({ summary: 'Processar documento com OCR completo' })
  async processDocument(@Param('documentId') documentId: string) {
    try {
      const qrResult = await this.qrCodeAtService.extractQrCodeFromDocument(documentId);
      if (qrResult.found) {
        return { method: 'QR_CODE_AT', ...qrResult };
      }
    } catch (error) {
      // QR Code não encontrado
    }

    const ocrResult = await this.ocrService.processDocumentWithOcr(documentId);
    return { method: 'OCR', ...ocrResult };
  }

  @Post('scan')
  @ApiOperation({ summary: 'Processar documento de scanner' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async scanDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const document = await this.prisma.document.create({
      data: {
        tenantId: user.tenantId,
        fileName: file.originalname,
        filePath: file.path,
        fileHash: '',
        mimeType: file.mimetype,
        size: file.size,
        origin: 'SCANNER',
        type: 'OUTRO',
        status: 'NOVO',
        uploadedById: user.id,
      },
    });

    const ocrResult = await this.ocrService.processDocumentWithOcr(document.id);

    return { document, ...ocrResult };
  }
}