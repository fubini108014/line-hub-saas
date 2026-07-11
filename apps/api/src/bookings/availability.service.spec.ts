import { AvailabilityService } from './availability.service';

// 2030-01-07 is a Monday, far in the future so the "block past slots" branch never triggers.
const DATE = '2030-01-07';
const QUERY = { merchantId: 'm1', staffId: 's1', serviceId: 'svc1', date: DATE };

describe('AvailabilityService.getSlots', () => {
  let prisma: { service: { findFirst: jest.Mock }; booking: { findMany: jest.Mock } };
  let businessHours: { getByDay: jest.Mock };
  let service: AvailabilityService;

  beforeEach(() => {
    prisma = {
      service: { findFirst: jest.fn() },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    };
    businessHours = { getByDay: jest.fn() };
    service = new AvailabilityService(prisma as any, businessHours as any);

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
});
