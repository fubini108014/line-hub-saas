import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AvailabilityService } from './availability.service';
import { BusinessHoursModule } from '../business-hours/business-hours.module';
import { StaffModule } from '../staff/staff.module';
import { CalendarSettingsModule } from '../calendar-settings/calendar-settings.module';

@Module({
  imports: [BusinessHoursModule, StaffModule, CalendarSettingsModule],
  controllers: [BookingsController],
  providers: [BookingsService, AvailabilityService],
  exports: [BookingsService, AvailabilityService],
})
export class BookingsModule {}
