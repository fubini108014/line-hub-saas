import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.merchant.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('此 Email 已被註冊');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const merchant = await this.prisma.merchant.create({
      data: { email: dto.email, passwordHash, companyName: dto.companyName },
    });

    await this.seedDefaultBusinessHours(merchant.id);

    return this.signTokens(merchant.id, merchant.email);
  }

  async login(dto: LoginDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { email: dto.email } });
    if (!merchant) throw new UnauthorizedException('Email 或密碼錯誤');

    const valid = await bcrypt.compare(dto.password, merchant.passwordHash);
    if (!valid) throw new UnauthorizedException('Email 或密碼錯誤');

    return this.signTokens(merchant.id, merchant.email);
  }

  private signTokens(merchantId: string, email: string) {
    const payload = { sub: merchantId, email };
    return {
      merchantId,
      accessToken: this.jwt.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      }),
    };
  }

  private async seedDefaultBusinessHours(merchantId: string) {
    const days = Array.from({ length: 7 }, (_, i) => ({
      merchantId,
      dayOfWeek: i,
      openTime: '09:00',
      closeTime: '18:00',
      isClosed: i === 0, // 週日預設休息
    }));

    await this.prisma.businessHour.createMany({ data: days });
  }
}
