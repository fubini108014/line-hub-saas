import * as crypto from 'crypto';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { encrypt } from '../common/utils/crypto.util';

const CHANNEL_SECRET = 'test-line-channel-secret';
const MERCHANT_ID = 'merchant-uuid-1';

function sign(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('base64');
}

describe('WebhookController signature verification', () => {
  let controller: WebhookController;
  let webhookService: jest.Mocked<Pick<WebhookService, 'getMerchant' | 'queueEvent'>>;
  const body = JSON.stringify({ events: [{ type: 'message' }, { type: 'follow' }] });

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  });

  beforeEach(() => {
    webhookService = {
      getMerchant: jest.fn().mockResolvedValue({
        id: MERCHANT_ID,
        lineChannelSecret: encrypt(CHANNEL_SECRET),
        lineLiffId: null,
      }),
      queueEvent: jest.fn().mockResolvedValue(undefined),
    };
    controller = new WebhookController(webhookService as unknown as WebhookService);
  });

  function makeReq(rawBody: string) {
    return { rawBody: Buffer.from(rawBody, 'utf8') } as any;
  }

  it('accepts a correctly signed request and queues every event', async () => {
    const result = await controller.handleWebhook(
      MERCHANT_ID,
      sign(body, CHANNEL_SECRET),
      makeReq(body),
    );
    expect(result).toEqual({ status: 'ok' });
    expect(webhookService.queueEvent).toHaveBeenCalledTimes(2);
    expect(webhookService.queueEvent).toHaveBeenCalledWith(MERCHANT_ID, { type: 'message' });
  });

  it('rejects a signature computed with the wrong secret', async () => {
    const result = await controller.handleWebhook(
      MERCHANT_ID,
      sign(body, 'wrong-secret'),
      makeReq(body),
    );
    expect(result).toEqual({ status: 'invalid_signature' });
    expect(webhookService.queueEvent).not.toHaveBeenCalled();
  });

  it('rejects when the body was tampered with after signing', async () => {
    const tampered = JSON.stringify({ events: [{ type: 'message', injected: true }] });
    const result = await controller.handleWebhook(
      MERCHANT_ID,
      sign(body, CHANNEL_SECRET),
      makeReq(tampered),
    );
    expect(result).toEqual({ status: 'invalid_signature' });
    expect(webhookService.queueEvent).not.toHaveBeenCalled();
  });

  it('rejects a missing signature header', async () => {
    const result = await controller.handleWebhook(MERCHANT_ID, undefined as any, makeReq(body));
    expect(result).toEqual({ status: 'invalid_signature' });
    expect(webhookService.queueEvent).not.toHaveBeenCalled();
  });

  it('rejects a malformed (non-base64 / truncated) signature without throwing', async () => {
    const result = await controller.handleWebhook(MERCHANT_ID, 'abc', makeReq(body));
    expect(result).toEqual({ status: 'invalid_signature' });
  });

  it('returns merchant_not_found for unknown or inactive merchants', async () => {
    webhookService.getMerchant.mockResolvedValue(null as any);
    const result = await controller.handleWebhook(
      'no-such-merchant',
      sign(body, CHANNEL_SECRET),
      makeReq(body),
    );
    expect(result).toEqual({ status: 'merchant_not_found' });
    expect(webhookService.queueEvent).not.toHaveBeenCalled();
  });
});
