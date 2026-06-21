import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentMerchant() merchantId: string) {
    return this.formsService.findAll(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentMerchant() merchantId: string, @Body() body: any) {
    return this.formsService.create(merchantId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.formsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/responses')
  getResponses(@CurrentMerchant() merchantId: string, @Param('id') formId: string) {
    return this.formsService.getResponses(merchantId, formId);
  }
}
