import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @UseGuards(JwtAuthGuard)
  @Get('programs')
  getPrograms(@CurrentMerchant() m: { id: string }) {
    return this.loyaltyService.findPrograms(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('programs')
  createProgram(
    @CurrentMerchant() m: { id: string },
    @Body() body: { name: string; stampsRequired: number; rewardDescription: string },
  ) {
    return this.loyaltyService.createProgram(m.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('programs/:id')
  updateProgram(
    @CurrentMerchant() m: { id: string },
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.loyaltyService.updateProgram(m.id, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stamp')
  addStamp(
    @CurrentMerchant() m: { id: string },
    @Body() body: { lineUserId: string; programId: string; count?: number },
  ) {
    return this.loyaltyService.addStamp(m.id, body.lineUserId, body.programId, body.count);
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  redeem(
    @CurrentMerchant() m: { id: string },
    @Body() body: { lineUserId: string; programId: string },
  ) {
    return this.loyaltyService.redeem(m.id, body.lineUserId, body.programId);
  }
}
