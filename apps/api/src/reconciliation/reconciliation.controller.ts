import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('suggestions')
  @ApiOperation({ summary: 'Listar sugestões de conciliação' })
  async getSuggestions(@CurrentUser() user: any) {
    return this.reconciliationService.getSuggestions(user.tenantId);
  }

  @Post(':transactionId/accept')
  @ApiOperation({ summary: 'Aceitar conciliação' })
  async acceptSuggestion(
    @CurrentUser() user: any,
    @Param('transactionId') transactionId: string,
    @Body() body: { entityId: string; entityType: string },
  ) {
    return this.reconciliationService.acceptSuggestion(
      user.tenantId,
      transactionId,
      body.entityId,
      body.entityType,
    );
  }

  @Post(':transactionId/reject')
  @ApiOperation({ summary: 'Rejeitar conciliação' })
  async rejectSuggestion(
    @CurrentUser() user: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.reconciliationService.rejectSuggestion(user.tenantId, transactionId);
  }
}