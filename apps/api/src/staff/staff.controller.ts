import { Controller, Get, Post, Patch, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto, AssignServicesDto } from './dto/create-staff.dto';

@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.staffService.findAll(m.id);
  }

  @Post()
  create(@CurrentMerchant() m: { id: string }, @Body() dto: CreateStaffDto) {
    return this.staffService.create(m.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentMerchant() m: { id: string },
    @Param('id') id: string,
    @Body() dto: Partial<CreateStaffDto>,
  ) {
    return this.staffService.update(m.id, id, dto);
  }

  @Put(':id/services')
  assignServices(
    @CurrentMerchant() m: { id: string },
    @Param('id') id: string,
    @Body() dto: AssignServicesDto,
  ) {
    return this.staffService.assignServices(m.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.staffService.remove(m.id, id);
  }
}
