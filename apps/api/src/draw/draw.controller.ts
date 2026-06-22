import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { DrawService } from './draw.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('draw')
export class DrawController {
  constructor(private drawService: DrawService) {}

  @UseGuards(JwtAuthGuard)
  @Get('campaigns')
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.drawService.findCampaigns(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns')
  create(@CurrentMerchant() m: { id: string }, @Body() body: any) {
    return this.drawService.createCampaign(m.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('campaigns/:id/entries')
  getEntries(@Param('id') campaignId: string) {
    return this.drawService.getCampaignEntries(campaignId);
  }
}
