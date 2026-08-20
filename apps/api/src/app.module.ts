import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { BankImportModule } from './bank-import/bank-import.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { PaymentsModule } from './payments/payments.module';
import { CrmModule } from './crm/crm.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ReportsModule } from './reports/reports.module';
import { ExportModule } from './export/export.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OcrModule } from './ocr/ocr.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    DocumentsModule,
    BankImportModule,
    ReconciliationModule,
    PaymentsModule,
    CrmModule,
    IntegrationsModule,
    ReportsModule,
    ExportModule,
    NotificationsModule,
    OcrModule,
  ],
})
export class AppModule {}