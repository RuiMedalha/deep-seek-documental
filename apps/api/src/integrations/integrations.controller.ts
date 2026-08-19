import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post(':type/configure')
  @ApiOperation({ summary: 'Configurar integração' })
  async configure(
    @CurrentUser() user: any,
    @Param('type') type: string,
    @Body() body: any,
  ) {
    return this.integrationsService.configure(user.tenantId, type, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar integrações' })
  async getIntegrations(@CurrentUser() user: any) {
    return this.integrationsService.getIntegrations(user.tenantId);
  }

  @Post(':type/disable')
  @ApiOperation({ summary: 'Desativar integração' })
  async disable(@CurrentUser() user: any, @Param('type') type: string) {
    return this.integrationsService.disableIntegration(user.tenantId, type);
  }

  @Post('toconline/send/:documentId')
  @ApiOperation({ summary: 'Enviar para TOConline' })
  async sendToToconline(@CurrentUser() user: any, @Param('documentId') documentId: string) {
    return this.integrationsService.sendToToconline(user.tenantId, documentId);
  }

  @Post('woocommerce/sync')
  @ApiOperation({ summary: 'Sincronizar WooCommerce' })
  async syncWooCommerce(@CurrentUser() user: any) {
    return this.integrationsService.syncWooCommerce(user.tenantId);
  }

  @Post('ifthenpay/callback')
  @ApiOperation({ summary: 'Callback Ifthenpay' })
  async ifthenpayCallback(@CurrentUser() user: any, @Body() body: any) {
    return this.integrationsService.handleIfthenpayCallback(user.tenantId, body);
  }

  @Post('moloni/sync')
  @ApiOperation({ summary: 'Sincronizar Moloni' })
  async syncMoloni(@CurrentUser() user: any) {
    return this.integrationsService.syncMoloni(user.tenantId);
  }
}