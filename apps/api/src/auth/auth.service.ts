import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private twoFactorService: TwoFactorService,
  ) {}

  async register(dto: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já registado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Criar tenant e admin
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName || 'Empresa',
        slug: this.generateSlug(dto.companyName || 'empresa'),
        users: {
          create: {
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    // Criar pipeline padrão do CRM
    await this.prisma.crmPipeline.create({
      data: {
        tenantId: tenant.id,
        name: 'Pipeline Padrão',
        isDefault: true,
        stages: [
          { id: 'LEAD', name: 'Lead', color: '#3B82F6' },
          { id: 'QUALIFIED', name: 'Qualificado', color: '#8B5CF6' },
          { id: 'PROPOSAL', name: 'Proposta', color: '#F59E0B' },
          { id: 'NEGOTIATION', name: 'Negociação', color: '#EF4444' },
          { id: 'WON', name: 'Ganho', color: '#10B981' },
          { id: 'LOST', name: 'Perdido', color: '#6B7280' },
        ],
      },
    });

    return {
      user: {
        id: tenant.users[0].id,
        email: tenant.users[0].email,
        name: tenant.users[0].name,
        role: tenant.users[0].role,
        tenantId: tenant.id,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  async login(dto: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar 2FA
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return {
          requiresTwoFactor: true,
          userId: user.id,
        };
      }
      await this.twoFactorService.verifyToken(user.id, dto.twoFactorCode);
    }

    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { tenant: true } } },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const tokens = await this.generateTokens(storedToken.user);

      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token: refreshToken },
    });
    return { success: true };
  }

  async inviteUser(dto: any, adminUser: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já registado');
    }

    const tempPassword = uuidv4().slice(0, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'OPERADOR',
        tenantId: adminUser.tenantId,
        canViewBankValues: dto.canViewBankValues || false,
        canViewReconciliation: dto.canViewReconciliation || false,
        canApprovePayments: dto.canApprovePayments || false,
        canExportData: dto.canExportData || false,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tempPassword,
    };
  }

  private async generateTokens(user: any) {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'access-secret',
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private generateSlug(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const random = uuidv4().slice(0, 4);
    return `${base}-${random}`;
  }
}