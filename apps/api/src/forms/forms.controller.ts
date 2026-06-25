import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.formsService.findAll(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentMerchant() m: { id: string }, @Body() body: any) {
    return this.formsService.create(m.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.formsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/responses')
  getResponses(@CurrentMerchant() m: { id: string }, @Param('id') formId: string) {
    return this.formsService.getResponses(m.id, formId);
  }
}
