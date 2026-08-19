import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registar nova empresa e admin' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  async register(@Body() dto: any) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de utilizador' })
  @ApiResponse({ status: 200, description: 'Login bem sucedido' })
  async login(@Body() dto: any) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout' })
  async logout(@CurrentUser() user: any, @Body('refreshToken') refreshToken: string) {
    return this.authService.logout(user.id, refreshToken);
  }

  @Post('invite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Convidar utilizador' })
  async invite(@CurrentUser() user: any, @Body() dto: any) {
    return this.authService.inviteUser(dto, user);
  }
}