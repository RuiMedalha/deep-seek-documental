import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('providers')
  async getProviders() {
    return this.aiService.getConfiguredProviders();
  }

  @Post('classify/:documentId')
  async classifyDocument(@Param('documentId') documentId: string, @Query('provider') provider?: string) {
    return this.aiService.classifyDocumentWithAi(documentId, provider);
  }

  @Post('fiscal-category')
  async suggestCategory(@Body('supplierName') supplierName: string, @Body('description') description: string) {
    return this.aiService.suggestFiscalCategory(supplierName, description);
  }

  @Get('summary/:month')
  async monthlySummary(@CurrentUser() user: any, @Param('month') month: string) {
    return this.aiService.generateMonthlySummary(user.tenantId, new Date(month));
  }
}