import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, AssignServicesDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  findAll(merchantId: string) {
    return this.prisma.staff.findMany({
      where: { merchantId, isActive: true },
      include: {
        staffServices: {
          include: { service: { select: { id: true, name: true, durationMinutes: true } } },
        },
      },
    });
  }

  create(merchantId: string, dto: CreateStaffDto) {
    return this.prisma.staff.create({ data: { merchantId, ...dto } });
  }

  async update(merchantId: string, id: string, dto: Partial<CreateStaffDto>) {
    await this.ensureOwnership(merchantId, id);
    return this.prisma.staff.update({ where: { id }, data: dto });
  }

  async assignServices(merchantId: string, staffId: string, dto: AssignServicesDto) {
    await this.ensureOwnership(merchantId, staffId);

    await this.prisma.$transaction([
      this.prisma.staffService.deleteMany({ where: { staffId } }),
      this.prisma.staffService.createMany({
        data: dto.serviceIds.map((serviceId) => ({ staffId, serviceId })),
      }),
    ]);

    return { success: true };
  }

  findByService(merchantId: string, serviceId: string) {
    return this.prisma.staff.findMany({
      where: {
        merchantId,
        isActive: true,
        isBookable: true,
        staffServices: { some: { serviceId } },
      },
      include: {
        staffServices: {
          include: { service: { select: { id: true, name: true, durationMinutes: true } } },
        },
      },
    });
  }

  findBookable(merchantId: string) {
    return this.prisma.staff.findMany({
      where: { merchantId, isActive: true, isBookable: true },
      include: {
        staffServices: {
          include: { service: { select: { id: true, name: true, durationMinutes: true } } },
        },
      },
    });
  }

  async remove(merchantId: string, id: string) {
    await this.ensureOwnership(merchantId, id);
    return this.prisma.staff.update({ where: { id }, data: { isActive: false } });
  }

  private async ensureOwnership(merchantId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id, merchantId } });
    if (!staff) throw new NotFoundException('人員不存在');
  }
}
