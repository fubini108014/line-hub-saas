import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  private today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getTodaySession(merchantId: string) {
    return this.prisma.queueSession.findUnique({
      where: { merchantId_date: { merchantId, date: this.today() } },
      include: {
        entries: {
          where: { status: { in: ['WAITING', 'CALLED'] } },
          orderBy: { queueNumber: 'asc' },
        },
      },
    });
  }

  openSession(merchantId: string) {
    const today = this.today();
    return this.prisma.queueSession.upsert({
      where: { merchantId_date: { merchantId, date: today } },
      create: { merchantId, date: today, isOpen: true },
      update: { isOpen: true },
    });
  }

  closeSession(merchantId: string) {
    return this.prisma.queueSession.update({
      where: { merchantId_date: { merchantId, date: this.today() } },
      data: { isOpen: false },
    });
  }

  async joinQueue(
    merchantId: string,
    lineUserId: string,
    data: { customerName: string; customerPhone: string; partySize?: number },
  ) {
    const session = await this.prisma.queueSession.findUnique({
      where: { merchantId_date: { merchantId, date: this.today() } },
    });
    if (!session || !session.isOpen) throw new BadRequestException('候位未開放');

    const member = await this.prisma.member.upsert({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
      create: { merchantId, lineUserId, displayName: data.customerName, phone: data.customerPhone },
      update: { phone: data.customerPhone },
    });

    const existing = await this.prisma.queueEntry.findFirst({
      where: { sessionId: session.id, memberId: member.id, status: 'WAITING' },
    });
    if (existing) throw new BadRequestException('您已在候位名單中');

    const updated = await this.prisma.queueSession.update({
      where: { id: session.id },
      data: { currentNumber: { increment: 1 } },
    });

    return this.prisma.queueEntry.create({
      data: {
        sessionId: session.id,
        memberId: member.id,
        queueNumber: updated.currentNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        partySize: data.partySize ?? 1,
      },
    });
  }

  async callNext(merchantId: string) {
    const session = await this.prisma.queueSession.findUnique({
      where: { merchantId_date: { merchantId, date: this.today() } },
    });
    if (!session) throw new NotFoundException('今日無候位場次');

    const next = await this.prisma.queueEntry.findFirst({
      where: { sessionId: session.id, status: 'WAITING' },
      orderBy: { queueNumber: 'asc' },
    });
    if (!next) throw new BadRequestException('無待候位');

    return this.prisma.queueEntry.update({
      where: { id: next.id },
      data: { status: 'CALLED', calledAt: new Date() },
      include: { member: true },
    });
  }

  updateEntryStatus(entryId: string, status: 'COMPLETED' | 'CANCELLED') {
    return this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : undefined },
    });
  }

  async getMyQueueStatus(merchantId: string, lineUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });
    if (!member) return null;

    const session = await this.prisma.queueSession.findUnique({
      where: { merchantId_date: { merchantId, date: this.today() } },
    });
    if (!session) return null;

    const entry = await this.prisma.queueEntry.findFirst({
      where: { sessionId: session.id, memberId: member.id, status: { in: ['WAITING', 'CALLED'] } },
    });
    if (!entry) return null;

    const aheadCount = await this.prisma.queueEntry.count({
      where: { sessionId: session.id, status: 'WAITING', queueNumber: { lt: entry.queueNumber } },
    });

    return { entry, aheadCount, session };
  }

  async cancelMyEntry(merchantId: string, lineUserId: string, entryId: string) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });
    if (!member) throw new NotFoundException('找不到此會員');

    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { session: true },
    });
    if (!entry) throw new NotFoundException('找不到此候位紀錄');

    if (entry.session.merchantId !== merchantId || entry.memberId !== member.id) {
      throw new BadRequestException('權限不足，無法取消此候位');
    }

    return this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'CANCELLED' },
    });
  }
}

