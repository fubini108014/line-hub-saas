import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { IsBoolean, IsString, IsInt, Min, Max, Matches } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { CalendarSettingsService, CalendarSettingsInput } from './calendar-settings.service';

class UpdateCalendarSettingsDto implements CalendarSettingsInput {
  @IsBoolean() enabled: boolean;
  @IsString() @Matches(/^\d{2}:\d{2}$/) morningEndTime: string;
  @IsString() @Matches(/^\d{2}:\d{2}$/) afternoonEndTime: string;
  @IsInt() @Min(0) @Max(50) lowStockThreshold: number;
}

@UseGuards(JwtAuthGuard)
@Controller('calendar-settings')
export class CalendarSettingsController {
  constructor(private calendarSettingsService: CalendarSettingsService) {}

  @Get()
  get(@CurrentMerchant() m: { id: string }) {
    return this.calendarSettingsService.getOrDefault(m.id);
  }

  @Put()
  update(@CurrentMerchant() m: { id: string }, @Body() dto: UpdateCalendarSettingsDto) {
    return this.calendarSettingsService.upsert(m.id, dto);
  }
}
