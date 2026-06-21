import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentMerchant() merchantId: string) {
    return this.reviewsService.findAll(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats(@CurrentMerchant() merchantId: string) {
    return this.reviewsService.getStats(merchantId);
  }
}
