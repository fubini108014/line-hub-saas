import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { IsArray, ValidateNested, IsInt, IsString, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { BusinessHoursService, BusinessHourInput } from './business-hours.service';

class BusinessHourItemDto implements BusinessHourInput {
  @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @IsString() openTime: string;
  @IsString() closeTime: string;
  @IsBoolean() isClosed: boolean;
}

class UpdateBusinessHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourItemDto)
  hours: BusinessHourItemDto[];
}

@UseGuards(JwtAuthGuard)
@Controller('business-hours')
export class BusinessHoursController {
  constructor(private businessHoursService: BusinessHoursService) {}

  @Get()
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.businessHoursService.findAll(m.id);
  }

  @Put()
  upsertAll(@CurrentMerchant() m: { id: string }, @Body() dto: UpdateBusinessHoursDto) {
    return this.businessHoursService.upsertAll(m.id, dto.hours);
  }
}
