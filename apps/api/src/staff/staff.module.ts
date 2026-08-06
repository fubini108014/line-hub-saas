import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffAvailabilityService } from './staff-availability.service';

@Module({
  controllers: [StaffController],
  providers: [StaffService, StaffAvailabilityService],
  exports: [StaffService, StaffAvailabilityService],
})
export class StaffModule {}
