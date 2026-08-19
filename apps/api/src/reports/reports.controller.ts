import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Estatísticas do dashboard' })
  async getDashboard(@CurrentUser() user: any) {
    return this.reportsService.getDashboardStats(user.tenantId);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Relatório de lucros e perdas' })
  async getProfitLoss(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getProfitLossReport(
      user.tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}