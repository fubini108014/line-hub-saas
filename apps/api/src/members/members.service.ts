import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  findAll(merchantId: string) {
    return this.prisma.member.findMany({
      where: { merchantId },
      include: {
        _count: { select: { bookings: true } },
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { bookingDate: true, status: true, service: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(merchantId: string, id: string) {
    return this.prisma.member.findFirst({
      where: { id, merchantId },
      include: {
        bookings: {
          include: {
            service: { select: { name: true, price: true } },
            staff: { select: { name: true } },
          },
          orderBy: { bookingDate: 'desc' },
        },
      },
    });
  }
}
