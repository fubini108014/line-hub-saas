import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  findAll(merchantId: string) {
    return this.prisma.coupon.findMany({
      where: { merchantId },
      include: { _count: { select: { claims: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(merchantId: string, data: any) {
    return this.prisma.coupon.create({ data: { merchantId, ...data } });
  }

  update(id: string, data: any) {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async getAvailable(merchantId: string, lineUserId: string) {
    const now = new Date();
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });

    const coupons = await this.prisma.coupon.findMany({
      where: { merchantId, isActive: true, validFrom: { lte: now }, validUntil: { gte: now } },
      include: member ? { claims: { where: { memberId: member.id } } } : undefined,
    });

    return coupons.map((c: any) => {
      const claimCount = c.claims?.length ?? 0;
      return { ...c, claimed: claimCount > 0, canClaim: claimCount < c.perMemberLimit };
    });
  }

  async claimCoupon(merchantId: string, lineUserId: string, couponId: string) {
    const now = new Date();
    const coupon = await this.prisma.coupon.findFirst({
      where: { id: couponId, merchantId, isActive: true, validFrom: { lte: now }, validUntil: { gte: now } },
      include: { _count: { select: { claims: true } } },
    });
    if (!coupon) throw new NotFoundException('Coupon not found or expired');
    if (coupon.totalLimit && coupon._count.claims >= coupon.totalLimit) {
      throw new BadRequestException('優惠券已兌完');
    }

    const member = await this.prisma.member.upsert({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
      create: { merchantId, lineUserId },
      update: {},
    });

    const existing = await this.prisma.couponClaim.findUnique({
      where: { couponId_memberId: { couponId, memberId: member.id } },
    });
    if (existing) throw new BadRequestException('已領取過此優惠券');

    return this.prisma.couponClaim.create({
      data: { couponId, memberId: member.id, merchantId },
      include: { coupon: true },
    });
  }

  async getMyClaims(merchantId: string, lineUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });
    if (!member) return [];
    return this.prisma.couponClaim.findMany({
      where: { memberId: member.id, merchantId },
      include: { coupon: true },
      orderBy: { claimedAt: 'desc' },
    });
  }

  async redeemCoupon(merchantId: string, claimId: string) {
    const claim = await this.prisma.couponClaim.findFirst({
      where: { id: claimId, merchantId, status: 'CLAIMED' },
    });
    if (!claim) throw new NotFoundException('Claim not found or already redeemed');
    return this.prisma.couponClaim.update({
      where: { id: claimId },
      data: { status: 'REDEEMED', redeemedAt: new Date() },
      include: { coupon: true },
    });
  }
}
