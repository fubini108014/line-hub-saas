import { Controller, Post, Param, Headers, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { WebhookService } from './webhook.service';
import { decrypt } from '../common/utils/crypto.util';

@Controller('webhook/v1')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post(':merchantId')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('merchantId') merchantId: string,
    @Headers('x-line-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const merchant = await this.webhookService.getMerchant(merchantId);
    if (!merchant || !merchant.lineChannelSecret) {
      return { status: 'merchant_not_found' };
    }

    const body = req.rawBody?.toString('utf8') ?? '';
    const channelSecret = decrypt(merchant.lineChannelSecret);
    const expectedSig = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');

    if (expectedSig !== signature) {
      return { status: 'invalid_signature' };
    }

    const { events } = JSON.parse(body) as { events: object[] };
    await Promise.all(events.map((event) => this.webhookService.queueEvent(merchantId, event)));

    return { status: 'ok' };
  }
}
