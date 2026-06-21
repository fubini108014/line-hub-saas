import { Controller, Get, Patch, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { MerchantsService } from './merchants.service';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { LineCredentialsDto } from './dto/line-credentials.dto';

@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @Get('me')
  getProfile(@CurrentMerchant() merchant: { id: string }) {
    return this.merchantsService.getProfile(merchant.id);
  }

  @Patch('me')
  update(@CurrentMerchant() merchant: { id: string }, @Body() dto: UpdateMerchantDto) {
    return this.merchantsService.update(merchant.id, dto);
  }

  @Put('me/line-credentials')
  saveLineCredentials(@CurrentMerchant() merchant: { id: string }, @Body() dto: LineCredentialsDto) {
    return this.merchantsService.saveLineCredentials(merchant.id, dto);
  }

  @Get('me/webhook-url')
  getWebhookUrl(@CurrentMerchant() merchant: { id: string }) {
    return {
      webhookUrl: `${process.env.API_BASE_URL}/webhook/v1/${merchant.id}`,
    };
  }
}
