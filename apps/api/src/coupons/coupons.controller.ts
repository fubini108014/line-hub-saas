import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.couponsService.findAll(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentMerchant() m: { id: string }, @Body() body: any) {
    return this.couponsService.create(m.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem/:claimId')
  redeem(@CurrentMerchant() m: { id: string }, @Param('claimId') claimId: string) {
    return this.couponsService.redeemCoupon(m.id, claimId);
  }
}
