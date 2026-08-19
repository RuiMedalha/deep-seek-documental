import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // Contactos
  @Post('contacts')
  @ApiOperation({ summary: 'Criar contacto' })
  async createContact(@CurrentUser() user: any, @Body() body: any) {
    return this.crmService.createContact(user.tenantId, user.id, body);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Listar contactos' })
  async getContacts(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.crmService.getContacts(user.tenantId, { search, type, page, limit });
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Detalhes do contacto' })
  async getContactDetails(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.getContactDetails(user.tenantId, id);
  }

  @Patch('contacts/:id')
  @ApiOperation({ summary: 'Atualizar contacto' })
  async updateContact(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.crmService.updateContact(user.tenantId, id, body);
  }

  @Delete('contacts/:id')
  @ApiOperation({ summary: 'Eliminar contacto' })
  async deleteContact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.deleteContact(user.tenantId, id);
  }

  // Oportunidades
  @Post('deals')
  @ApiOperation({ summary: 'Criar oportunidade' })
  async createDeal(@CurrentUser() user: any, @Body() body: any) {
    return this.crmService.createDeal(user.tenantId, user.id, body);
  }

  @Get('deals')
  @ApiOperation({ summary: 'Listar oportunidades' })
  async getDeals(
    @CurrentUser() user: any,
    @Query('stage') stage?: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.crmService.getDeals(user.tenantId, { stage, contactId });
  }

  @Patch('deals/:id/stage')
  @ApiOperation({ summary: 'Atualizar estado da oportunidade' })
  async updateDealStage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('stage') stage: string,
  ) {
    return this.crmService.updateDealStage(user.tenantId, id, stage, user.id);
  }

  // Atividades
  @Post('activities')
  @ApiOperation({ summary: 'Criar atividade' })
  async createActivity(@CurrentUser() user: any, @Body() body: any) {
    return this.crmService.createActivity(user.tenantId, user.id, body);
  }

  @Get('activities/pending')
  @ApiOperation({ summary: 'Listar atividades pendentes' })
  async getPendingActivities(@CurrentUser() user: any) {
    return this.crmService.getPendingActivities(user.tenantId, user.id);
  }

  @Patch('activities/:id/complete')
  @ApiOperation({ summary: 'Completar atividade' })
  async completeActivity(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.completeActivity(user.tenantId, id);
  }

  // Pipeline
  @Get('pipeline/stats')
  @ApiOperation({ summary: 'Estatísticas do pipeline' })
  async getPipelineStats(@CurrentUser() user: any) {
    return this.crmService.getPipelineStats(user.tenantId);
  }
}