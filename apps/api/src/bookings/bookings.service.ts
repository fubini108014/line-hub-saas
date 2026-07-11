import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new BadRequestException('服務項目不存在');

    const startMinutes = timeToMinutes(dto.startTime);
    const endTime = minutesToTime(startMinutes + service.durationMinutes);
    const bookingDate = new Date(dto.date);

    // Upsert member first
    const member = await this.prisma.member.upsert({
      where: { merchantId_lineUserId: { merchantId: dto.merchantId, lineUserId: dto.lineUserId } },
      create: {
        merchantId: dto.merchantId,
        lineUserId: dto.lineUserId,
        phone: dto.customerPhone,
        displayName: dto.customerName,
      },
      update: { phone: dto.customerPhone },
    });

    // Create booking in transaction with conflict lock
    return this.prisma.$transaction(async (tx) => {
      // Columns are camelCase in Postgres (schema has no @map), so they must be quoted.
      const conflicts = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM bookings
        WHERE "staffId" = ${dto.staffId}
          AND "merchantId" = ${dto.merchantId}
          AND "bookingDate" = ${bookingDate}::date
          AND status NOT IN ('CANCELLED')
          AND "startTime" < ${endTime}
          AND "endTime" > ${dto.startTime}
        FOR UPDATE
      `;

      if (conflicts.length > 0) {
        throw new ConflictException('此時段已被預約，請重新選擇');
      }

      return tx.booking.create({
        data: {
          merchantId: dto.merchantId,
          memberId: member.id,
          serviceId: dto.serviceId,
          staffId: dto.staffId,
          bookingDate,
          startTime: dto.startTime,
          endTime,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          notes: dto.notes,
          status: 'PENDING',
        },
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
      });
    });
  }

  findAll(merchantId: string, query: { date?: string; staffId?: string; status?: string }) {
    return this.prisma.booking.findMany({
      where: {
        merchantId,
        ...(query.date && { bookingDate: new Date(query.date) }),
        ...(query.staffId && { staffId: query.staffId }),
        ...(query.status && { status: query.status as any }),
      },
      include: {
        member: { select: { displayName: true, lineUserId: true } },
        service: { select: { name: true, price: true } },
        staff: { select: { name: true } },
      },
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateStatus(merchantId: string, id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findFirst({ where: { id, merchantId } });
    if (!booking) throw new NotFoundException('預約不存在');

    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
      include: {
        member: { select: { lineUserId: true, displayName: true } },
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
    });
  }

  async getCalendar(merchantId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const bookings = await this.prisma.booking.findMany({
      where: {
        merchantId,
        bookingDate: { gte: start, lte: end },
        status: { notIn: ['CANCELLED'] },
      },
      select: { bookingDate: true, status: true },
    });

    const countByDate: Record<string, number> = {};
    for (const b of bookings) {
      const key = b.bookingDate.toISOString().slice(0, 10);
      countByDate[key] = (countByDate[key] ?? 0) + 1;
    }

    return countByDate;
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
