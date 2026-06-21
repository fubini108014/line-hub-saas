import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookProcessor } from './webhook.processor';
import { LineModule } from '../line/line.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'line-events' }),
    LineModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookProcessor],
})
export class WebhookModule {}
