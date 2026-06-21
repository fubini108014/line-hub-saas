import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DrawService {
  constructor(private prisma: PrismaService) {}

  findCampaigns(merchantId: string) {
    return this.prisma.drawCampaign.findMany({
      where: { merchantId },
      include: { prizes: true, _count: { select: { entries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  getActiveCampaign(merchantId: string) {
    const now = new Date();
    return this.prisma.drawCampaign.findFirst({
      where: { merchantId, isActive: true, startAt: { lte: now }, endAt: { gte: now } },
      include: { prizes: true },
    });
  }

  createCampaign(merchantId: string, data: any) {
    const { prizes, ...rest } = data;
    return this.prisma.drawCampaign.create({
      data: {
        merchantId,
        ...rest,
        prizes: prizes ? { create: prizes } : undefined,
      },
      include: { prizes: true },
    });
  }

  async performDraw(merchantId: string, lineUserId: string, campaignId: string) {
    const now = new Date();
    const campaign = await this.prisma.drawCampaign.findFirst({
      where: { id: campaignId, merchantId, isActive: true, startAt: { lte: now }, endAt: { gte: now } },
      include: { prizes: true },
    });
    if (!campaign) throw new NotFoundException('活動不存在或已結束');

    const member = await this.prisma.member.upsert({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
      create: { merchantId, lineUserId },
      update: {},
    });

    const entryCount = await this.prisma.drawEntry.count({
      where: { campaignId, memberId: member.id },
    });
    if (entryCount >= campaign.maxEntriesPerMember) throw new BadRequestException('已達抽獎次數上限');

    const rand = Math.random();
    let cumulative = 0;
    let wonPrize: (typeof campaign.prizes)[0] | null = null;

    for (const prize of campaign.prizes) {
      if (prize.totalCount !== null && prize.claimedCount >= prize.totalCount) continue;
      cumulative += Number(prize.probability);
      if (rand <= cumulative) {
        wonPrize = prize;
        break;
      }
    }

    const entry = await this.prisma.drawEntry.create({
      data: { campaignId, memberId: member.id, prizeId: wonPrize?.id ?? null, isWinner: !!wonPrize },
      include: { prize: true },
    });

    if (wonPrize) {
      await this.prisma.drawPrize.update({
        where: { id: wonPrize.id },
        data: { claimedCount: { increment: 1 } },
      });
    }

    return entry;
  }

  getCampaignEntries(campaignId: string) {
    return this.prisma.drawEntry.findMany({
      where: { campaignId },
      include: { member: true, prize: true },
      orderBy: { drawnAt: 'desc' },
    });
  }
}
