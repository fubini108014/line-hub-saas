import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @UseGuards(JwtAuthGuard)
  @Get('today')
  getTodaySession(@CurrentMerchant() merchantId: string) {
    return this.queueService.getTodaySession(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('open')
  openSession(@CurrentMerchant() merchantId: string) {
    return this.queueService.openSession(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('close')
  closeSession(@CurrentMerchant() merchantId: string) {
    return this.queueService.closeSession(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('call-next')
  callNext(@CurrentMerchant() merchantId: string) {
    return this.queueService.callNext(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('entries/:id')
  updateEntry(
    @Param('id') id: string,
    @Body() body: { status: 'COMPLETED' | 'CANCELLED' },
  ) {
    return this.queueService.updateEntryStatus(id, body.status);
  }
}
