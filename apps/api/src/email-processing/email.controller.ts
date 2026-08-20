import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailProcessorService } from './email-processor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
  constructor(private emailProcessor: EmailProcessorService) {}

  @Post('configure')
  @ApiOperation({ summary: 'Configurar receção de email' })
  async configure(@CurrentUser() user: any, @Body() body: any) {
    return this.emailProcessor.configureEmailReceiving(user.tenantId, body);
  }

  @Post('process-invoice')
  @ApiOperation({ summary: 'Processar email com fatura' })
  async processInvoice(@CurrentUser() user: any, @Body() body: any) {
    return this.emailProcessor.processInvoiceEmail(user.tenantId, body);
  }

  @Post('process-payment')
  @ApiOperation({ summary: 'Processar email de pagamento' })
  async processPayment(@CurrentUser() user: any, @Body() body: any) {
    return this.emailProcessor.processPaymentEmail(user.tenantId, body);
  }
}