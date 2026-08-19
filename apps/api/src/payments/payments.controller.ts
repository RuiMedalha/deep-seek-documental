import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar pagamento' })
  async createPayment(@CurrentUser() user: any, @Body() body: any) {
    return this.paymentsService.createPayment(user.tenantId, user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pagamentos' })
  async getPayments(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.getPayments(user.tenantId, { status, page, limit });
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Eventos do calendário' })
  async getCalendar(@CurrentUser() user: any, @Query('month') month: string) {
    return this.paymentsService.getCalendarEvents(user.tenantId, new Date(month));
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Próximos pagamentos' })
  async getUpcoming(@CurrentUser() user: any, @Query('days') days = 7) {
    return this.paymentsService.getUpcomingPayments(user.tenantId, Number(days));
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Pagamentos em atraso' })
  async getOverdue(@CurrentUser() user: any) {
    return this.paymentsService.getOverduePayments(user.tenantId);
  }

  @Patch(':id/paid')
  @ApiOperation({ summary: 'Marcar como pago' })
  async markAsPaid(@CurrentUser() user: any, @Param('id') id: string) {
    return this.paymentsService.markAsPaid(user.tenantId, id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar pagamento' })
  async cancelPayment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.paymentsService.cancelPayment(user.tenantId, id);
  }
}