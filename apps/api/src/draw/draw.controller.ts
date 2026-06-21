import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { DrawService } from './draw.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('draw')
export class DrawController {
  constructor(private drawService: DrawService) {}

  @UseGuards(JwtAuthGuard)
  @Get('campaigns')
  findAll(@CurrentMerchant() merchantId: string) {
    return this.drawService.findCampaigns(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns')
  create(@CurrentMerchant() merchantId: string, @Body() body: any) {
    return this.drawService.createCampaign(merchantId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('campaigns/:id/entries')
  getEntries(@Param('id') campaignId: string) {
    return this.drawService.getCampaignEntries(campaignId);
  }
}
