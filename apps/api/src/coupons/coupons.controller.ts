import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentMerchant() merchantId: string) {
    return this.couponsService.findAll(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentMerchant() merchantId: string, @Body() body: any) {
    return this.couponsService.create(merchantId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem/:claimId')
  redeem(@CurrentMerchant() merchantId: string, @Param('claimId') claimId: string) {
    return this.couponsService.redeemCoupon(merchantId, claimId);
  }
}
