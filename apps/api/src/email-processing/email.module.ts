import { Module } from '@nestjs/common';
import { EmailProcessorService } from './email-processor.service';
import { EmailController } from './email.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { OcrModule } from '../ocr/ocr.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    OcrModule,
  ],
  controllers: [EmailController],
  providers: [EmailProcessorService],
  exports: [EmailProcessorService],
})
export class EmailModule {}