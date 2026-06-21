import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('line-events') private lineEventsQueue: Queue,
  ) {}

  async getMerchant(merchantId: string) {
    return this.prisma.merchant.findUnique({
      where: { id: merchantId, isActive: true },
      select: { id: true, lineChannelSecret: true, lineLiffId: true },
    });
  }

  async queueEvent(merchantId: string, event: object) {
    await this.lineEventsQueue.add(
      'process-event',
      { merchantId, event },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );
  }
}
