import { Controller, Get, Post, Patch, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IsArray, ValidateNested, IsInt, IsString, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { StaffService } from './staff.service';
import { StaffAvailabilityService, StaffAvailabilityInput } from './staff-availability.service';
import { CreateStaffDto, AssignServicesDto } from './dto/create-staff.dto';

class StaffAvailabilityItemDto implements StaffAvailabilityInput {
  @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @IsBoolean() useMerchantHours: boolean;
  @IsString() openTime: string;
  @IsString() closeTime: string;
  @IsBoolean() isOff: boolean;
}

class UpdateStaffAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAvailabilityItemDto)
  days: StaffAvailabilityItemDto[];
}

@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(
    private staffService: StaffService,
    private staffAvailabilityService: StaffAvailabilityService,
  ) {}

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

  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.staffAvailabilityService.findAll(id);
  }

  @Put(':id/availability')
  upsertAvailability(
    @CurrentMerchant() m: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateStaffAvailabilityDto,
  ) {
    return this.staffAvailabilityService.upsertAll(m.id, id, dto.days);
  }
}
