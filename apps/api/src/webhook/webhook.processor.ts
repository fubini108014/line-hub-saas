import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from '../line/line.service';

interface LineEvent {
  type: string;
  replyToken?: string;
  source: { userId: string };
  message?: { type: string; text: string };
  postback?: { data: string };
}

@Processor('line-events')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private prisma: PrismaService,
    private lineService: LineService,
  ) {
    super();
  }

  async process(job: Job<{ merchantId: string; event: LineEvent }>) {
    const { merchantId, event } = job.data;

    try {
      switch (event.type) {
        case 'follow':
          await this.handleFollow(merchantId, event);
          break;
        case 'message':
          if (event.message?.type === 'text') {
            await this.handleText(merchantId, event);
          }
          break;
        case 'postback':
          await this.handlePostback(merchantId, event);
          break;
      }
    } catch (err) {
      this.logger.error(`Event processing failed: ${err}`);
      throw err; // Let BullMQ retry
    }
  }

  private async handleFollow(merchantId: string, event: LineEvent) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { lineLiffId: true },
    });

    if (event.replyToken && merchant?.lineLiffId) {
      await this.lineService.replyWithBookingLiff(merchantId, event.replyToken, merchant.lineLiffId);
    }
  }

  private async handleText(merchantId: string, event: LineEvent) {
    const keywords = ['預約', '我要預約', 'booking', '約'];
    const text = event.message?.text?.trim() ?? '';

    if (!keywords.some((k) => text.includes(k))) return;

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { lineLiffId: true },
    });

    if (event.replyToken && merchant?.lineLiffId) {
      await this.lineService.replyWithBookingLiff(merchantId, event.replyToken, merchant.lineLiffId);
    }
  }

  private async handlePostback(merchantId: string, event: LineEvent) {
    const params = new URLSearchParams(event.postback?.data ?? '');
    const action = params.get('action');
    const bookingId = params.get('bookingId');

    if (action === 'cancel_booking' && bookingId) {
      const booking = await this.prisma.booking.update({
        where: { id: bookingId, merchantId },
        data: { status: 'CANCELLED' },
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
      });

      await this.lineService.sendBookingStatusUpdate(merchantId, event.source.userId, {
        ...booking,
        status: 'CANCELLED',
      });
    }
  }
}
