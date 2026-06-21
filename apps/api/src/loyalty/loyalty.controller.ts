import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @UseGuards(JwtAuthGuard)
  @Get('programs')
  getPrograms(@CurrentMerchant() merchantId: string) {
    return this.loyaltyService.findPrograms(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('programs')
  createProgram(
    @CurrentMerchant() merchantId: string,
    @Body() body: { name: string; stampsRequired: number; rewardDescription: string },
  ) {
    return this.loyaltyService.createProgram(merchantId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('programs/:id')
  updateProgram(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.loyaltyService.updateProgram(merchantId, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stamp')
  addStamp(
    @CurrentMerchant() merchantId: string,
    @Body() body: { lineUserId: string; programId: string; count?: number },
  ) {
    return this.loyaltyService.addStamp(merchantId, body.lineUserId, body.programId, body.count);
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  redeem(
    @CurrentMerchant() merchantId: string,
    @Body() body: { lineUserId: string; programId: string },
  ) {
    return this.loyaltyService.redeem(merchantId, body.lineUserId, body.programId);
  }
}
