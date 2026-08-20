import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { QrCodeAtService } from './qrcode-at.service';
import { ScannerService } from './scanner.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OcrController],
  providers: [OcrService, QrCodeAtService, ScannerService],
  exports: [OcrService, QrCodeAtService, ScannerService],
})
export class OcrModule {}