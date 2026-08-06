import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StaffAvailabilityInput {
  dayOfWeek: number;
  useMerchantHours: boolean;
  openTime: string;
  closeTime: string;
  isOff: boolean;
}

@Injectable()
export class StaffAvailabilityService {
  constructor(private prisma: PrismaService) {}

  findAll(staffId: string) {
    return this.prisma.staffAvailability.findMany({
      where: { staffId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  getByDay(staffId: string, dayOfWeek: number) {
    return this.prisma.staffAvailability.findUnique({
      where: { staffId_dayOfWeek: { staffId, dayOfWeek } },
    });
  }

  findManyByStaffIds(staffIds: string[]) {
    if (staffIds.length === 0) return Promise.resolve([]);
    return this.prisma.staffAvailability.findMany({ where: { staffId: { in: staffIds } } });
  }

  async upsertAll(merchantId: string, staffId: string, rows: StaffAvailabilityInput[]) {
    const staff = await this.prisma.staff.findFirst({ where: { id: staffId, merchantId } });
    if (!staff) throw new NotFoundException('人員不存在');

    await Promise.all(
      rows.map((r) =>
        this.prisma.staffAvailability.upsert({
          where: { staffId_dayOfWeek: { staffId, dayOfWeek: r.dayOfWeek } },
          create: { staffId, ...r },
          update: {
            useMerchantHours: r.useMerchantHours,
            openTime: r.openTime,
            closeTime: r.closeTime,
            isOff: r.isOff,
          },
        }),
      ),
    );

    return this.findAll(staffId);
  }
}
