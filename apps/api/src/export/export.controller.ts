import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Exportar transações para Excel' })
  async exportTransactions(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportTransactionsToExcel(user.tenantId, {
      startDate,
      endDate,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transacoes.xlsx');
    res.send(buffer);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Exportar faturas para Excel' })
  async exportInvoices(@CurrentUser() user: any, @Res() res: Response) {
    const buffer = await this.exportService.exportInvoicesToExcel(user.tenantId);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=faturas.xlsx');
    res.send(buffer);
  }
}