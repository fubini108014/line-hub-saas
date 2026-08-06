import { Module } from '@nestjs/common';
import { CalendarSettingsController } from './calendar-settings.controller';
import { CalendarSettingsService } from './calendar-settings.service';

@Module({
  controllers: [CalendarSettingsController],
  providers: [CalendarSettingsService],
  exports: [CalendarSettingsService],
})
export class CalendarSettingsModule {}
