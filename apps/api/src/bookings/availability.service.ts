import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessHoursService } from '../business-hours/business-hours.service';
import { StaffAvailabilityService } from '../staff/staff-availability.service';
import { CalendarSettingsService } from '../calendar-settings/calendar-settings.service';

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

export type DayStatus = 'available' | 'full' | 'closed' | 'past';

export interface DayAvailabilityInfo {
  status: DayStatus;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

function segmentOf(minutes: number, morningEnd: number, afternoonEnd: number): 'morning' | 'afternoon' | 'evening' {
  if (minutes < morningEnd) return 'morning';
  if (minutes < afternoonEnd) return 'afternoon';
  return 'evening';
}

interface BusinessHourLike {
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface StaffOverrideLike {
  useMerchantHours: boolean;
  openTime: string;
  closeTime: string;
  isOff: boolean;
}

interface EffectiveWindow {
  open: number;
  close: number;
}

// Combines merchant-wide business hours with an optional per-staff override for one day.
// No override row (or useMerchantHours: true) → staff simply follows the merchant's hours.
// Otherwise the staff's own window is intersected with the merchant's (never wider than it).
function effectiveWindow(
  businessHour: BusinessHourLike | null | undefined,
  override: StaffOverrideLike | null | undefined,
): EffectiveWindow | null {
  if (!businessHour || businessHour.isClosed) return null;
  const merchantOpen = timeToMinutes(businessHour.openTime);
  const merchantClose = timeToMinutes(businessHour.closeTime);

  if (!override || override.useMerchantHours) {
    return { open: merchantOpen, close: merchantClose };
  }
  if (override.isOff) return null;

  const open = Math.max(merchantOpen, timeToMinutes(override.openTime));
  const close = Math.min(merchantClose, timeToMinutes(override.closeTime));
  if (open >= close) return null;
  return { open, close };
}

export interface DayAvailabilityItem {
  staffId: string;
  staffName: string;
  avatarUrl: string | null;
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  time: string;
}

const SLOT_INTERVAL = 30;

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private businessHoursService: BusinessHoursService,
    private staffAvailabilityService: StaffAvailabilityService,
    private calendarSettingsService: CalendarSettingsService,
  ) {}

  async getSlots(query: AvailabilityQuery): Promise<TimeSlot[]> {
    const targetDate = new Date(query.date);
    const dayOfWeek = targetDate.getDay();

    const [service, businessHour, staffOverride, existingBookings] = await Promise.all([
      this.prisma.service.findFirst({
        where: { id: query.serviceId, merchantId: query.merchantId, isActive: true },
      }),
      this.businessHoursService.getByDay(query.merchantId, dayOfWeek),
      this.staffAvailabilityService.getByDay(query.staffId, dayOfWeek),
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

    if (!service) return [];
    const window = effectiveWindow(businessHour, staffOverride);
    if (!window) return [];

    const slots: TimeSlot[] = [];
    let current = window.open;
    const close = window.close;
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

  async getMonthAvailability(
    merchantId: string,
    year: number,
    month: number,
    staffId?: string,
  ): Promise<Record<string, DayAvailabilityInfo>> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const rangeStart = new Date(year, month - 1, 1);
    const rangeEnd = new Date(year, month, 1);
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    const [businessHours, staff, bookings, calendarSettings] = await Promise.all([
      this.businessHoursService.findAll(merchantId),
      this.prisma.staff.findMany({
        where: { merchantId, isActive: true, isBookable: true, ...(staffId ? { id: staffId } : {}) },
        include: {
          staffServices: {
            include: { service: { select: { id: true, durationMinutes: true, isActive: true } } },
          },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          merchantId,
          bookingDate: { gte: rangeStart, lt: rangeEnd },
          status: { notIn: ['CANCELLED'] },
        },
        select: { staffId: true, bookingDate: true, startTime: true, endTime: true },
      }),
      this.calendarSettingsService.getOrDefault(merchantId),
    ]);

    const morningEnd = timeToMinutes(calendarSettings.morningEndTime);
    const afternoonEnd = timeToMinutes(calendarSettings.afternoonEndTime);

    const staffAvailabilityRows = await this.staffAvailabilityService.findManyByStaffIds(
      staff.map((s) => s.id),
    );
    const overrideByStaffDay = new Map(staffAvailabilityRows.map((r) => [`${r.staffId}|${r.dayOfWeek}`, r]));

    const businessHourByDay = new Map(businessHours.map((h) => [h.dayOfWeek, h]));
    const bookingsByStaffDate = new Map<string, { startTime: string; endTime: string }[]>();
    for (const b of bookings) {
      const key = `${b.staffId}|${b.bookingDate.toISOString().slice(0, 10)}`;
      const list = bookingsByStaffDate.get(key) ?? [];
      list.push(b);
      bookingsByStaffDate.set(key, list);
    }

    const result: Record<string, DayAvailabilityInfo> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (dateStr < todayStr) {
        result[dateStr] = { status: 'past', morning: false, afternoon: false, evening: false };
        continue;
      }

      const dayOfWeek = new Date(year, month - 1, day).getDay();
      const businessHour = businessHourByDay.get(dayOfWeek);
      if (!businessHour || businessHour.isClosed) {
        result[dateStr] = { status: 'closed', morning: false, afternoon: false, evening: false };
        continue;
      }

      const isToday = dateStr === todayStr;

      let morning = false;
      let afternoon = false;
      let evening = false;

      outer: for (const s of staff) {
        const window = effectiveWindow(businessHour, overrideByStaffDay.get(`${s.id}|${dayOfWeek}`));
        if (!window) continue;

        for (const ss of s.staffServices) {
          if (!ss.service.isActive) continue;
          const duration = ss.service.durationMinutes;
          const existing = bookingsByStaffDate.get(`${s.id}|${dateStr}`) ?? [];

          for (let current = window.open; current + duration <= window.close; current += SLOT_INTERVAL) {
            if (isToday && current <= nowMinutes) continue;
            const slotStart = current;
            const slotEnd = current + duration;
            const isBooked = existing.some(
              (b) => slotStart < timeToMinutes(b.endTime) && slotEnd > timeToMinutes(b.startTime),
            );
            if (!isBooked) {
              const segment = segmentOf(current, morningEnd, afternoonEnd);
              if (segment === 'morning') morning = true;
              else if (segment === 'afternoon') afternoon = true;
              else evening = true;
            }
            if (morning && afternoon && evening) break outer;
          }
        }
      }

      const hasAvailability = morning || afternoon || evening;
      result[dateStr] = { status: hasAvailability ? 'available' : 'full', morning, afternoon, evening };
    }

    return result;
  }

  async getDayAvailability(
    merchantId: string,
    date: string,
    staffId?: string,
  ): Promise<DayAvailabilityItem[]> {
    const dayOfWeek = new Date(date).getDay();
    const businessHour = await this.businessHoursService.getByDay(merchantId, dayOfWeek);
    if (!businessHour || businessHour.isClosed) return [];

    const staff = await this.prisma.staff.findMany({
      where: { merchantId, isActive: true, isBookable: true, ...(staffId ? { id: staffId } : {}) },
      include: {
        staffServices: {
          include: {
            service: {
              select: { id: true, name: true, durationMinutes: true, price: true, isActive: true },
            },
          },
        },
      },
    });

    const items: DayAvailabilityItem[] = [];

    for (const s of staff) {
      for (const ss of s.staffServices) {
        if (!ss.service.isActive) continue;
        const slots = await this.getSlots({
          merchantId,
          staffId: s.id,
          serviceId: ss.service.id,
          date,
        });
        for (const slot of slots) {
          if (!slot.available) continue;
          items.push({
            staffId: s.id,
            staffName: s.name,
            avatarUrl: s.avatarUrl,
            serviceId: ss.service.id,
            serviceName: ss.service.name,
            price: Number(ss.service.price),
            durationMinutes: ss.service.durationMinutes,
            time: slot.time,
          });
        }
      }
    }

    items.sort((a, b) => a.time.localeCompare(b.time) || a.staffName.localeCompare(b.staffName));
    return items;
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
