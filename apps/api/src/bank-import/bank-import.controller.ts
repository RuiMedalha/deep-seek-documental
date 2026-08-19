import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BankImportService } from './bank-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('bank-import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bank-import')
export class BankImportController {
  constructor(private readonly bankImportService: BankImportService) {}

  @Post('csv/upload')
  @ApiOperation({ summary: 'Upload de CSV bancário' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.bankImportService.parseCsv(file, user.tenantId);
  }

  @Post('csv/import')
  @ApiOperation({ summary: 'Importar CSV bancário' })
  async importCsv(@CurrentUser() user: any, @Body() body: any) {
    return this.bankImportService.importCsv(user.tenantId, body);
  }
}