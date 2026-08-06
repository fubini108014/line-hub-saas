import { AvailabilityService } from './availability.service';

// 2030-01-07 is a Monday, far in the future so the "block past slots" branch never triggers.
const DATE = '2030-01-07';
const QUERY = { merchantId: 'm1', staffId: 's1', serviceId: 'svc1', date: DATE };

const DEFAULT_CALENDAR_SETTINGS = {
  enabled: true,
  morningEndTime: '12:00',
  afternoonEndTime: '17:00',
  lowStockThreshold: 3,
};

describe('AvailabilityService.getSlots', () => {
  let prisma: { service: { findFirst: jest.Mock }; booking: { findMany: jest.Mock } };
  let businessHours: { getByDay: jest.Mock };
  let staffAvailability: { getByDay: jest.Mock; findManyByStaffIds: jest.Mock };
  let calendarSettings: { getOrDefault: jest.Mock };
  let service: AvailabilityService;

  beforeEach(() => {
    prisma = {
      service: { findFirst: jest.fn() },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    };
    businessHours = { getByDay: jest.fn() };
    staffAvailability = {
      getByDay: jest.fn().mockResolvedValue(null),
      findManyByStaffIds: jest.fn().mockResolvedValue([]),
    };
    calendarSettings = { getOrDefault: jest.fn().mockResolvedValue(DEFAULT_CALENDAR_SETTINGS) };
    service = new AvailabilityService(
      prisma as any,
      businessHours as any,
      staffAvailability as any,
      calendarSettings as any,
    );

    prisma.service.findFirst.mockResolvedValue({ id: 'svc1', durationMinutes: 60 });
    businessHours.getByDay.mockResolvedValue({
      openTime: '09:00',
      closeTime: '12:00',
      isClosed: false,
    });
  });

  it('generates 30-minute slots that fit the service duration before closing', async () => {
    const slots = await service.getSlots(QUERY);
    expect(slots.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('marks every slot overlapping an existing booking as unavailable', async () => {
    prisma.booking.findMany.mockResolvedValue([{ startTime: '10:00', endTime: '11:00' }]);
    const slots = await service.getSlots(QUERY);
    expect(slots).toEqual([
      { time: '09:00', available: true }, // 09:00–10:00 touches but does not overlap
      { time: '09:30', available: false }, // 09:30–10:30 overlaps
      { time: '10:00', available: false },
      { time: '10:30', available: false }, // 10:30–11:30 overlaps
      { time: '11:00', available: true }, // 11:00–12:00 starts as booking ends
    ]);
  });

  it('excludes cancelled bookings from the overlap query', async () => {
    await service.getSlots(QUERY);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { notIn: ['CANCELLED'] } }),
      }),
    );
  });

  it('returns no slots on a closed day', async () => {
    businessHours.getByDay.mockResolvedValue({
      openTime: '09:00',
      closeTime: '12:00',
      isClosed: true,
    });
    expect(await service.getSlots(QUERY)).toEqual([]);
  });

  it('returns no slots when business hours are missing or the service is inactive', async () => {
    businessHours.getByDay.mockResolvedValue(null);
    expect(await service.getSlots(QUERY)).toEqual([]);

    businessHours.getByDay.mockResolvedValue({
      openTime: '09:00',
      closeTime: '12:00',
      isClosed: false,
    });
    prisma.service.findFirst.mockResolvedValue(null);
    expect(await service.getSlots(QUERY)).toEqual([]);
  });

  it('never emits a slot whose end time exceeds closing time', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 'svc1', durationMinutes: 90 });
    const slots = await service.getSlots(QUERY);
    expect(slots.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('marks past slots of today as unavailable', async () => {
    // The service compares against new Date().toISOString(), so build "today" the same way.
    const today = new Date().toISOString().slice(0, 10);
    businessHours.getByDay.mockResolvedValue({
      openTime: '00:00',
      closeTime: '23:30',
      isClosed: false,
    });
    prisma.service.findFirst.mockResolvedValue({ id: 'svc1', durationMinutes: 30 });

    const slots = await service.getSlots({ ...QUERY, date: today });
    const firstSlot = slots[0]; // 00:00 is always in the past once the day has started
    expect(firstSlot.time).toBe('00:00');
    expect(firstSlot.available).toBe(false);
  });

  it('follows merchant hours entirely when the staff has no override for that day', async () => {
    staffAvailability.getByDay.mockResolvedValue(null);
    const slots = await service.getSlots(QUERY);
    expect(slots.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  it('follows merchant hours when the staff override has useMerchantHours: true', async () => {
    staffAvailability.getByDay.mockResolvedValue({
      useMerchantHours: true,
      openTime: '10:00',
      closeTime: '11:00',
      isOff: false,
    });
    const slots = await service.getSlots(QUERY);
    expect(slots.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  it('returns no slots when the staff override marks the day off', async () => {
    staffAvailability.getByDay.mockResolvedValue({
      useMerchantHours: false,
      openTime: '09:00',
      closeTime: '12:00',
      isOff: true,
    });
    expect(await service.getSlots(QUERY)).toEqual([]);
  });

  it('intersects a narrower staff override with merchant business hours', async () => {
    staffAvailability.getByDay.mockResolvedValue({
      useMerchantHours: false,
      openTime: '10:00',
      closeTime: '11:00',
      isOff: false,
    });
    // Merchant hours are 09:00–12:00; the 60-minute service duration only fits one slot (10:00–11:00)
    // inside the staff's narrower 10:00–11:00 window.
    const slots = await service.getSlots(QUERY);
    expect(slots.map((s) => s.time)).toEqual(['10:00']);
  });

  it('never lets a staff override extend past merchant business hours', async () => {
    staffAvailability.getByDay.mockResolvedValue({
      useMerchantHours: false,
      openTime: '08:00',
      closeTime: '14:00',
      isOff: false,
    });
    const slots = await service.getSlots(QUERY);
    // Merchant hours (09:00–12:00) still cap the window even though the staff override is wider.
    expect(slots.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });
});

// 2030-01 is a month far in the future so no day in it is ever "past".
describe('AvailabilityService.getMonthAvailability', () => {
  let prisma: {
    staff: { findMany: jest.Mock };
    booking: { findMany: jest.Mock };
  };
  let businessHours: { findAll: jest.Mock };
  let staffAvailability: { findManyByStaffIds: jest.Mock };
  let calendarSettings: { getOrDefault: jest.Mock };
  let service: AvailabilityService;

  const STAFF = [
    {
      id: 's1',
      staffServices: [
        { service: { id: 'svc1', durationMinutes: 60, isActive: true } },
      ],
    },
  ];

  beforeEach(() => {
    prisma = {
      staff: { findMany: jest.fn().mockResolvedValue(STAFF) },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    };
    businessHours = {
      findAll: jest.fn().mockResolvedValue(
        Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          openTime: '09:00',
          closeTime: '12:00',
          isClosed: dayOfWeek === 0, // Sundays closed
        })),
      ),
    };
    staffAvailability = { findManyByStaffIds: jest.fn().mockResolvedValue([]) };
    calendarSettings = { getOrDefault: jest.fn().mockResolvedValue(DEFAULT_CALENDAR_SETTINGS) };
    service = new AvailabilityService(
      prisma as any,
      businessHours as any,
      staffAvailability as any,
      calendarSettings as any,
    );
  });

  it('marks a closed weekday as "closed"', async () => {
    // 2030-01-06 is a Sunday
    const result = await service.getMonthAvailability('m1', 2030, 1);
    expect(result['2030-01-06']).toEqual({ status: 'closed', morning: false, afternoon: false, evening: false });
  });

  it('marks an open day with no bookings as "available"', async () => {
    // Business hours 09:00–12:00 only ever produce morning slots.
    const result = await service.getMonthAvailability('m1', 2030, 1);
    expect(result['2030-01-07']).toEqual({ status: 'available', morning: true, afternoon: false, evening: false });
  });

  it('marks an open day as "full" once every slot for every staff/service is booked', async () => {
    prisma.booking.findMany.mockResolvedValue([
      { staffId: 's1', bookingDate: new Date('2030-01-07'), startTime: '09:00', endTime: '12:00' },
    ]);
    const result = await service.getMonthAvailability('m1', 2030, 1);
    expect(result['2030-01-07']).toEqual({ status: 'full', morning: false, afternoon: false, evening: false });
  });

  it('breaks availability down into morning/afternoon/evening segments', async () => {
    businessHours.findAll.mockResolvedValue(
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        openTime: '09:00',
        closeTime: '20:00',
        isClosed: dayOfWeek === 0,
      })),
    );
    // Booked solid from 09:00 to 17:00 — only the evening (17:00+) is left free.
    prisma.booking.findMany.mockResolvedValue([
      { staffId: 's1', bookingDate: new Date('2030-01-07'), startTime: '09:00', endTime: '17:00' },
    ]);
    const result = await service.getMonthAvailability('m1', 2030, 1);
    expect(result['2030-01-07']).toEqual({ status: 'available', morning: false, afternoon: false, evening: true });
  });

  it('uses the merchant-configured segment boundaries instead of the 12:00/17:00 defaults', async () => {
    calendarSettings.getOrDefault.mockResolvedValue({
      ...DEFAULT_CALENDAR_SETTINGS,
      morningEndTime: '10:00',
      afternoonEndTime: '11:00',
    });
    businessHours.findAll.mockResolvedValue(
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        openTime: '09:00',
        closeTime: '11:00',
        isClosed: dayOfWeek === 0,
      })),
    );
    // Slots run 09:00–10:30. With the default 12:00 morning cutoff these would all be
    // "morning"; with a 10:00 cutoff the 10:00/10:30 slots fall into "afternoon" instead.
    const result = await service.getMonthAvailability('m1', 2030, 1);
    expect(result['2030-01-07']).toEqual({ status: 'available', morning: true, afternoon: true, evening: false });
  });

  it('returns one entry per day of the month', async () => {
    const result = await service.getMonthAvailability('m1', 2030, 1);
    expect(Object.keys(result)).toHaveLength(31);
  });

  it('filters the staff query by staffId when provided', async () => {
    await service.getMonthAvailability('m1', 2030, 1, 's1');
    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 's1', isBookable: true }) }),
    );
  });

  it('treats a day the staff has marked off as unavailable for that staff, even when the merchant is open', async () => {
    staffAvailability.findManyByStaffIds.mockResolvedValue([
      { staffId: 's1', dayOfWeek: 1, useMerchantHours: false, openTime: '09:00', closeTime: '12:00', isOff: true },
    ]);
    const result = await service.getMonthAvailability('m1', 2030, 1);
    // 2030-01-07 is a Monday (dayOfWeek 1) — merchant is open but the only staff is off.
    expect(result['2030-01-07']).toEqual({ status: 'full', morning: false, afternoon: false, evening: false });
  });

  it('narrows a staff day to their own override hours intersected with merchant hours', async () => {
    businessHours.findAll.mockResolvedValue(
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        openTime: '09:00',
        closeTime: '20:00',
        isClosed: dayOfWeek === 0,
      })),
    );
    staffAvailability.findManyByStaffIds.mockResolvedValue([
      { staffId: 's1', dayOfWeek: 1, useMerchantHours: false, openTime: '17:00', closeTime: '20:00', isOff: false },
    ]);
    const result = await service.getMonthAvailability('m1', 2030, 1);
    // Staff only works 17:00–20:00 on Mondays, so only the evening segment has anything.
    expect(result['2030-01-07']).toEqual({ status: 'available', morning: false, afternoon: false, evening: true });
  });
});

describe('AvailabilityService.getDayAvailability', () => {
  let prisma: {
    staff: { findMany: jest.Mock };
    service: { findFirst: jest.Mock };
    booking: { findMany: jest.Mock };
  };
  let businessHours: { getByDay: jest.Mock };
  let staffAvailability: { getByDay: jest.Mock; findManyByStaffIds: jest.Mock };
  let calendarSettings: { getOrDefault: jest.Mock };
  let service: AvailabilityService;

  const STAFF = [
    {
      id: 's1',
      name: 'David',
      avatarUrl: null,
      staffServices: [
        {
          service: { id: 'svc1', name: '剪髮', durationMinutes: 60, price: 800, isActive: true },
        },
      ],
    },
  ];

  beforeEach(() => {
    prisma = {
      staff: { findMany: jest.fn().mockResolvedValue(STAFF) },
      service: { findFirst: jest.fn().mockResolvedValue({ id: 'svc1', durationMinutes: 60 }) },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    };
    businessHours = {
      getByDay: jest.fn().mockResolvedValue({ openTime: '09:00', closeTime: '10:00', isClosed: false }),
    };
    staffAvailability = {
      getByDay: jest.fn().mockResolvedValue(null),
      findManyByStaffIds: jest.fn().mockResolvedValue([]),
    };
    calendarSettings = { getOrDefault: jest.fn().mockResolvedValue(DEFAULT_CALENDAR_SETTINGS) };
    service = new AvailabilityService(
      prisma as any,
      businessHours as any,
      staffAvailability as any,
      calendarSettings as any,
    );
  });

  it('flattens every available staff/service/time combination', async () => {
    // openTime 09:00, closeTime 10:00, 60-minute duration → exactly one slot (09:00).
    const items = await service.getDayAvailability('m1', DATE);
    expect(items).toEqual([
      { staffId: 's1', staffName: 'David', avatarUrl: null, serviceId: 'svc1', serviceName: '剪髮', price: 800, durationMinutes: 60, time: '09:00' },
    ]);
  });

  it('returns an empty list on a closed day', async () => {
    businessHours.getByDay.mockResolvedValue({ openTime: '09:00', closeTime: '10:00', isClosed: true });
    expect(await service.getDayAvailability('m1', DATE)).toEqual([]);
  });

  it('filters the staff query by staffId and isBookable when provided', async () => {
    await service.getDayAvailability('m1', DATE, 's1');
    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 's1', isBookable: true }) }),
    );
  });

  it('skips services marked inactive', async () => {
    prisma.staff.findMany.mockResolvedValue([
      {
        ...STAFF[0],
        staffServices: [
          { service: { id: 'svc2', name: '停用項目', durationMinutes: 60, price: 500, isActive: false } },
        ],
      },
    ]);
    expect(await service.getDayAvailability('m1', DATE)).toEqual([]);
  });

  it('excludes a staff member whose override marks the day off', async () => {
    staffAvailability.getByDay.mockResolvedValue({
      useMerchantHours: false,
      openTime: '09:00',
      closeTime: '10:00',
      isOff: true,
    });
    expect(await service.getDayAvailability('m1', DATE)).toEqual([]);
  });
});
