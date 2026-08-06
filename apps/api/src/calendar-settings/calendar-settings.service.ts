import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CalendarSettingsInput {
  enabled: boolean;
  morningEndTime: string;
  afternoonEndTime: string;
  lowStockThreshold: number;
}

const DEFAULTS: CalendarSettingsInput = {
  enabled: true,
  morningEndTime: '12:00',
  afternoonEndTime: '17:00',
  lowStockThreshold: 3,
};

@Injectable()
export class CalendarSettingsService {
  constructor(private prisma: PrismaService) {}

  async getOrDefault(merchantId: string): Promise<CalendarSettingsInput> {
    const settings = await this.prisma.calendarSettings.findUnique({ where: { merchantId } });
    if (!settings) return DEFAULTS;
    return {
      enabled: settings.enabled,
      morningEndTime: settings.morningEndTime,
      afternoonEndTime: settings.afternoonEndTime,
      lowStockThreshold: settings.lowStockThreshold,
    };
  }

  async upsert(merchantId: string, dto: CalendarSettingsInput) {
    return this.prisma.calendarSettings.upsert({
      where: { merchantId },
      create: { merchantId, ...dto },
      update: { ...dto },
    });
  }
}
