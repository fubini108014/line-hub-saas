import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll(merchantId: string) {
    return this.prisma.service.findMany({
      where: { merchantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(merchantId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({ data: { merchantId, ...dto } });
  }

  async update(merchantId: string, id: string, dto: Partial<CreateServiceDto>) {
    await this.ensureOwnership(merchantId, id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async remove(merchantId: string, id: string) {
    await this.ensureOwnership(merchantId, id);
    return this.prisma.service.update({ where: { id }, data: { isActive: false } });
  }

  private async ensureOwnership(merchantId: string, id: string) {
    const service = await this.prisma.service.findFirst({ where: { id, merchantId } });
    if (!service) throw new NotFoundException('服務項目不存在');
  }
}
