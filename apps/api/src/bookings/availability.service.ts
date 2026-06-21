import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessHoursService } from '../business-hours/business-hours.service';

export interface AvailabilityQuery {
  merchantId: string;
  staffId: string;
  serviceId: string;
  date: string; // "YYYY-MM-DD"
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

const SLOT_INTERVAL = 30;

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private businessHoursService: BusinessHoursService,
  ) {}

  async getSlots(query: AvailabilityQuery): Promise<TimeSlot[]> {
    const targetDate = new Date(query.date);
    const dayOfWeek = targetDate.getDay();

    const [service, businessHour, existingBookings] = await Promise.all([
      this.prisma.service.findFirst({
        where: { id: query.serviceId, merchantId: query.merchantId, isActive: true },
      }),
      this.businessHoursService.getByDay(query.merchantId, dayOfWeek),
      this.prisma.booking.findMany({
        where: {
          merchantId: query.merchantId,
          staffId: query.staffId,
          bookingDate: targetDate,
          status: { notIn: ['CANCELLED'] },
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

    if (!service || !businessHour || businessHour.isClosed) return [];

    const slots: TimeSlot[] = [];
    let current = timeToMinutes(businessHour.openTime);
    const close = timeToMinutes(businessHour.closeTime);
    const duration = service.durationMinutes;

    while (current + duration <= close) {
      const slotStart = minutesToTime(current);
      const slotEnd = minutesToTime(current + duration);

      const isBooked = existingBookings.some(
        (b) =>
          timeToMinutes(slotStart) < timeToMinutes(b.endTime) &&
          timeToMinutes(slotEnd) > timeToMinutes(b.startTime),
      );

      // Block past time slots for today
      const isPast =
        query.date === new Date().toISOString().slice(0, 10) &&
        current <= new Date().getHours() * 60 + new Date().getMinutes();

      slots.push({ time: slotStart, available: !isBooked && !isPast });
      current += SLOT_INTERVAL;
    }

    return slots;
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
