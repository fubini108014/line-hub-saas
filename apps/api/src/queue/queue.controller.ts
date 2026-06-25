import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @UseGuards(JwtAuthGuard)
  @Get('today')
  getTodaySession(@CurrentMerchant() m: { id: string }) {
    return this.queueService.getTodaySession(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('open')
  openSession(@CurrentMerchant() m: { id: string }) {
    return this.queueService.openSession(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('close')
  closeSession(@CurrentMerchant() m: { id: string }) {
    return this.queueService.closeSession(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('call-next')
  callNext(@CurrentMerchant() m: { id: string }) {
    return this.queueService.callNext(m.id);
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
