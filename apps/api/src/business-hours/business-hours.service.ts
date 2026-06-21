import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface BusinessHourInput {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

@Injectable()
export class BusinessHoursService {
  constructor(private prisma: PrismaService) {}

  findAll(merchantId: string) {
    return this.prisma.businessHour.findMany({
      where: { merchantId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async upsertAll(merchantId: string, hours: BusinessHourInput[]) {
    await Promise.all(
      hours.map((h) =>
        this.prisma.businessHour.upsert({
          where: { merchantId_dayOfWeek: { merchantId, dayOfWeek: h.dayOfWeek } },
          create: { merchantId, ...h },
          update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
        }),
      ),
    );
    return this.findAll(merchantId);
  }

  async getByDay(merchantId: string, dayOfWeek: number) {
    return this.prisma.businessHour.findUnique({
      where: { merchantId_dayOfWeek: { merchantId, dayOfWeek } },
    });
  }
}
