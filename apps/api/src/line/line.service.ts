import { Injectable, Logger } from '@nestjs/common';
import { MerchantsService } from '../merchants/merchants.service';
import { buildBookingConfirmationFlex, buildBookingStatusFlex } from './flex-messages/booking-confirmation';

interface BookingRecord {
  id: string;
  startTime: string;
  endTime: string;
  bookingDate: Date;
  customerName: string;
  service: { name: string };
  staff: { name: string };
}

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);

  constructor(private merchantsService: MerchantsService) {}

  async sendBookingConfirmation(merchantId: string, lineUserId: string, booking: BookingRecord) {
    const token = await this.merchantsService.getDecryptedToken(merchantId);
    if (!token) return;

    const merchant = await this.merchantsService.getProfile(merchantId);

    const message = buildBookingConfirmationFlex({
      shopName: merchant.companyName,
      serviceName: booking.service.name,
      staffName: booking.staff.name,
      date: booking.bookingDate.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }),
      startTime: booking.startTime,
      endTime: booking.endTime,
      customerName: booking.customerName,
      bookingId: booking.id,
    });

    await this.pushMessage(token, lineUserId, [message]);
  }

  async sendBookingStatusUpdate(
    merchantId: string,
    lineUserId: string,
    booking: BookingRecord & { status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' },
  ) {
    const token = await this.merchantsService.getDecryptedToken(merchantId);
    if (!token) return;

    const merchant = await this.merchantsService.getProfile(merchantId);

    const message = buildBookingStatusFlex({
      shopName: merchant.companyName,
      status: booking.status,
      bookingId: booking.id,
      date: booking.bookingDate.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }),
      startTime: booking.startTime,
    });

    await this.pushMessage(token, lineUserId, [message]);
  }

  async replyWithBookingLiff(merchantId: string, replyToken: string, liffId: string) {
    const token = await this.merchantsService.getDecryptedToken(merchantId);
    if (!token) return;

    const message = {
      type: 'flex',
      altText: '點擊開始預約',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '立即預約', weight: 'bold', size: 'xl' },
            { type: 'text', text: '點擊下方按鈕選擇服務與時段', size: 'sm', color: '#888888', margin: 'md' },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: '開始預約',
                uri: `https://liff.line.me/${liffId}?mid=${merchantId}`,
              },
            },
          ],
        },
      },
    };

    await this.replyMessage(token, replyToken, [message]);
  }

  private async pushMessage(token: string, userId: string, messages: object[]) {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages }),
    });

    if (!res.ok) {
      this.logger.error(`LINE push failed: ${res.status} ${await res.text()}`);
    }
  }

  private async replyMessage(token: string, replyToken: string, messages: object[]) {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });

    if (!res.ok) {
      this.logger.error(`LINE reply failed: ${res.status} ${await res.text()}`);
    }
  }
}
