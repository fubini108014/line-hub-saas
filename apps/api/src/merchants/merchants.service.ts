import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from '../common/utils/crypto.util';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { LineCredentialsDto } from './dto/line-credentials.dto';

@Injectable()
export class MerchantsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        email: true,
        companyName: true,
        address: true,
        logoUrl: true,
        lineChannelId: true,
        lineLiffId: true,
        createdAt: true,
      },
    });

    if (!merchant) throw new NotFoundException('商家不存在');

    return {
      ...merchant,
      hasLineCredentials: !!merchant.lineChannelId,
      webhookUrl: `${process.env.API_BASE_URL}/webhook/v1/${merchantId}`,
    };
  }

  async update(merchantId: string, dto: UpdateMerchantDto) {
    return this.prisma.merchant.update({
      where: { id: merchantId },
      data: dto,
      select: { id: true, companyName: true, address: true, logoUrl: true },
    });
  }

  async saveLineCredentials(merchantId: string, dto: LineCredentialsDto) {
    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: {
        lineChannelId: dto.channelId,
        lineChannelSecret: encrypt(dto.channelSecret),
        lineAccessToken: encrypt(dto.accessToken),
        lineLiffId: dto.liffId,
      },
    });
    return { success: true };
  }

  async getDecryptedToken(merchantId: string): Promise<string | null> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { lineAccessToken: true },
    });
    if (!merchant?.lineAccessToken) return null;
    return decrypt(merchant.lineAccessToken);
  }

  async getDecryptedSecret(merchantId: string): Promise<string | null> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { lineChannelSecret: true },
    });
    if (!merchant?.lineChannelSecret) return null;
    return decrypt(merchant.lineChannelSecret);
  }
}
