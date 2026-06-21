import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.servicesService.findAll(m.id);
  }

  @Post()
  create(@CurrentMerchant() m: { id: string }, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(m.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentMerchant() m: { id: string },
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceDto>,
  ) {
    return this.servicesService.update(m.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.servicesService.remove(m.id, id);
  }
}
