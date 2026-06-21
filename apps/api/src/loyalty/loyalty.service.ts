import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  findPrograms(merchantId: string) {
    return this.prisma.loyaltyProgram.findMany({
      where: { merchantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  createProgram(merchantId: string, data: { name: string; stampsRequired: number; rewardDescription: string }) {
    return this.prisma.loyaltyProgram.create({ data: { merchantId, ...data } });
  }

  updateProgram(merchantId: string, id: string, data: Partial<{ name: string; stampsRequired: number; rewardDescription: string; isActive: boolean }>) {
    return this.prisma.loyaltyProgram.update({ where: { id }, data });
  }

  async getCard(merchantId: string, lineUserId: string, programId: string) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });

    let card = member
      ? await this.prisma.loyaltyCard.findUnique({
          where: { memberId_programId: { memberId: member.id, programId } },
          include: { program: true, events: { orderBy: { createdAt: 'desc' }, take: 10 } },
        })
      : null;

    if (!card && member) {
      card = await this.prisma.loyaltyCard.create({
        data: { merchantId, memberId: member.id, programId },
        include: { program: true, events: { orderBy: { createdAt: 'desc' }, take: 10 } },
      });
    }
    return card;
  }

  async addStamp(merchantId: string, lineUserId: string, programId: string, count = 1) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id: programId, merchantId, isActive: true },
    });
    if (!program) throw new NotFoundException('Program not found');

    let card = await this.prisma.loyaltyCard.findUnique({
      where: { memberId_programId: { memberId: member.id, programId } },
    });

    if (!card) {
      card = await this.prisma.loyaltyCard.create({
        data: { merchantId, memberId: member.id, programId },
      });
    }

    const [updatedCard] = await this.prisma.$transaction([
      this.prisma.loyaltyCard.update({
        where: { id: card.id },
        data: { stamps: { increment: count }, totalEarned: { increment: count } },
      }),
      this.prisma.stampEvent.create({
        data: { cardId: card.id, type: 'EARN', count },
      }),
    ]);
    return updatedCard;
  }

  async redeem(merchantId: string, lineUserId: string, programId: string) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    const card = await this.prisma.loyaltyCard.findUnique({
      where: { memberId_programId: { memberId: member.id, programId } },
      include: { program: true },
    });
    if (!card) throw new NotFoundException('Card not found');
    if (card.stamps < card.program.stampsRequired) throw new BadRequestException('點數不足');

    const [updatedCard] = await this.prisma.$transaction([
      this.prisma.loyaltyCard.update({
        where: { id: card.id },
        data: { stamps: { decrement: card.program.stampsRequired } },
      }),
      this.prisma.stampEvent.create({
        data: { cardId: card.id, type: 'REDEEM', count: card.program.stampsRequired },
      }),
    ]);
    return updatedCard;
  }
}
