import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de documento' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Documento carregado com sucesso' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.documentsService.uploadDocument(file, user, body);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Listar documentos do inbox' })
  async getInbox(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.documentsService.getInbox(user.tenantId, {
      status,
      type,
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de documentos' })
  async getStats(@CurrentUser() user: any) {
    return this.documentsService.getDocumentStats(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter documento por ID' })
  async getDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getDocument(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  async updateDocument(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.documentsService.updateDocument(id, user.tenantId, body, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar documento' })
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.deleteDocument(id, user.tenantId, user.id);
  }
}