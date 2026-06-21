import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { BookingsService } from './bookings.service';
import { UpdateBookingStatusDto } from './dto/create-booking.dto';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  findAll(
    @CurrentMerchant() m: { id: string },
    @Query('date') date?: string,
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findAll(m.id, { date, staffId, status });
  }

  @Get('calendar')
  getCalendar(
    @CurrentMerchant() m: { id: string },
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.bookingsService.getCalendar(m.id, parseInt(year), parseInt(month));
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentMerchant() m: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(m.id, id, dto);
  }
}
