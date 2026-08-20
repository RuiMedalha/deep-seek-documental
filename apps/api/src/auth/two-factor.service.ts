import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {}

  async generateSecret(userId: string) {
    // Em produção, usar speakeasy para gerar secret real
    return {
      secret: `SECRET_${Date.now()}`,
      qrCode: `qr_${userId}`,
    };
  }

  async verifyAndEnable(userId: string, token: string) {
    return { enabled: true };
  }

  async verifyToken(userId: string, token: string) {
    return true;
  }
}