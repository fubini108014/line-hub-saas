import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(data: {
    merchantId: string;
    lineUserId: string;
    bookingId?: string;
    rating: number;
    comment?: string;
  }) {
    if (data.rating < 1 || data.rating > 5) throw new BadRequestException('Rating must be 1-5');

    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId: data.merchantId, lineUserId: data.lineUserId } },
    });
    if (!member) throw new BadRequestException('Member not found');

    if (data.bookingId) {
      const existing = await this.prisma.review.findUnique({ where: { bookingId: data.bookingId } });
      if (existing) throw new BadRequestException('已評價過此次預約');
    }

    return this.prisma.review.create({
      data: {
        merchantId: data.merchantId,
        memberId: member.id,
        bookingId: data.bookingId,
        rating: data.rating,
        comment: data.comment,
      },
    });
  }

  findAll(merchantId: string) {
    return this.prisma.review.findMany({
      where: { merchantId },
      include: { member: true, booking: { include: { service: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(merchantId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { merchantId },
      select: { rating: true },
    });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return { count: reviews.length, average: Math.round(avg * 10) / 10 };
  }

  async getMyBookings(merchantId: string, lineUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });
    if (!member) return [];
    const bookings = await this.prisma.booking.findMany({
      where: { merchantId, memberId: member.id },
      include: { service: true, staff: true, review: true },
      orderBy: { bookingDate: 'desc' },
      take: 20,
    });
    return bookings.map((b) => ({
      id: b.id,
      serviceName: b.service.name,
      staffName: b.staff.name,
      bookingDate: b.bookingDate,
      startTime: b.startTime,
      status: b.status,
      reviewId: b.review?.id,
    }));
  }
}
