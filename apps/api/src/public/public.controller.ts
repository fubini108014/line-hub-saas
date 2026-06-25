import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { AvailabilityService } from '../bookings/availability.service';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { LineService } from '../line/line.service';
import { ServicesService } from '../services/services.service';
import { StaffService } from '../staff/staff.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { ReviewsService } from '../reviews/reviews.service';
import { QueueService } from '../queue/queue.service';
import { CouponsService } from '../coupons/coupons.service';
import { FormsService } from '../forms/forms.service';
import { OrdersService } from '../orders/orders.service';
import { DrawService } from '../draw/draw.service';
import { IsUUID, IsDateString } from 'class-validator';

class AvailabilityQueryDto {
  @IsUUID() merchantId: string;
  @IsUUID() staffId: string;
  @IsUUID() serviceId: string;
  @IsDateString() date: string;
}

@Controller('public')
export class PublicController {
  constructor(
    private bookingsService: BookingsService,
    private availabilityService: AvailabilityService,
    private lineService: LineService,
    private servicesService: ServicesService,
    private staffService: StaffService,
    private loyaltyService: LoyaltyService,
    private reviewsService: ReviewsService,
    private queueService: QueueService,
    private couponsService: CouponsService,
    private formsService: FormsService,
    private ordersService: OrdersService,
    private drawService: DrawService,
  ) {}

  // ── Booking ──────────────────────────────────────────────────────────────
  @Get('services')
  getServices(@Query('merchantId') merchantId: string) {
    return this.servicesService.findAll(merchantId);
  }

  @Get('staff')
  getStaff(@Query('merchantId') merchantId: string, @Query('serviceId') serviceId: string) {
    return this.staffService.findByService(merchantId, serviceId);
  }

  @Get('availability')
  getAvailability(@Query() query: AvailabilityQueryDto) {
    return this.availabilityService.getSlots(query);
  }

  @Post('bookings')
  async createBooking(@Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.create(dto);
    this.lineService
      .sendBookingConfirmation(dto.merchantId, dto.lineUserId, booking)
      .catch(() => {});
    return booking;
  }

  // ── My Bookings ──────────────────────────────────────────────────────────
  @Get('my-bookings')
  getMyBookings(
    @Query('merchantId') merchantId: string,
    @Query('lineUserId') lineUserId: string,
  ) {
    return this.reviewsService.getMyBookings(merchantId, lineUserId);
  }

  // ── Loyalty ──────────────────────────────────────────────────────────────
  @Get('loyalty/programs')
  getLoyaltyPrograms(@Query('merchantId') merchantId: string) {
    return this.loyaltyService.findPrograms(merchantId);
  }

  @Get('loyalty/card')
  getLoyaltyCard(
    @Query('merchantId') merchantId: string,
    @Query('lineUserId') lineUserId: string,
    @Query('programId') programId: string,
  ) {
    return this.loyaltyService.getCard(merchantId, lineUserId, programId);
  }

  @Post('loyalty/redeem')
  redeemLoyalty(@Body() body: { merchantId: string; lineUserId: string; programId: string }) {
    return this.loyaltyService.redeem(body.merchantId, body.lineUserId, body.programId);
  }

  // ── Reviews ──────────────────────────────────────────────────────────────
  @Post('reviews')
  createReview(
    @Body() body: { merchantId: string; lineUserId: string; bookingId?: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview(body);
  }

  // ── Queue ─────────────────────────────────────────────────────────────────
  @Get('queue/session')
  getQueueSession(@Query('merchantId') merchantId: string) {
    return this.queueService.getTodaySession(merchantId);
  }

  @Get('queue/status')
  getQueueStatus(
    @Query('merchantId') merchantId: string,
    @Query('lineUserId') lineUserId: string,
  ) {
    return this.queueService.getMyQueueStatus(merchantId, lineUserId);
  }

  @Post('queue/join')
  joinQueue(
    @Body() body: { merchantId: string; lineUserId: string; customerName: string; customerPhone: string; partySize?: number },
  ) {
    return this.queueService.joinQueue(body.merchantId, body.lineUserId, body);
  }

  @Post('queue/cancel')
  cancelQueue(@Body() body: { merchantId: string; lineUserId: string; entryId: string }) {
    return this.queueService.cancelMyEntry(body.merchantId, body.lineUserId, body.entryId);
  }

  // ── Coupons ───────────────────────────────────────────────────────────────
  @Get('coupons')
  getAvailableCoupons(
    @Query('merchantId') merchantId: string,
    @Query('lineUserId') lineUserId: string,
  ) {
    return this.couponsService.getAvailable(merchantId, lineUserId);
  }

  @Get('coupons/my-claims')
  getMyClaims(
    @Query('merchantId') merchantId: string,
    @Query('lineUserId') lineUserId: string,
  ) {
    return this.couponsService.getMyClaims(merchantId, lineUserId);
  }

  @Post('coupons/claim')
  claimCoupon(@Body() body: { merchantId: string; lineUserId: string; couponId: string }) {
    return this.couponsService.claimCoupon(body.merchantId, body.lineUserId, body.couponId);
  }

  // ── Forms ─────────────────────────────────────────────────────────────────
  @Get('forms/:id')
  getForm(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Post('forms/:id/submit')
  submitForm(
    @Param('id') formId: string,
    @Body() body: { merchantId: string; lineUserId?: string; answers: Record<string, any> },
  ) {
    return this.formsService.submitResponse({ formId, ...body });
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  @Get('menu')
  getMenu(@Query('merchantId') merchantId: string) {
    return this.ordersService.getMenu(merchantId);
  }

  @Post('orders')
  createOrder(
    @Body() body: { merchantId: string; lineUserId: string; items: any[]; note?: string; pickupTime?: string },
  ) {
    return this.ordersService.createOrder(body.merchantId, body.lineUserId, body);
  }

  @Get('my-orders')
  getMyOrders(
    @Query('merchantId') merchantId: string,
    @Query('lineUserId') lineUserId: string,
  ) {
    return this.ordersService.getMyOrders(merchantId, lineUserId);
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  @Get('draw/active')
  getActiveDraw(@Query('merchantId') merchantId: string) {
    return this.drawService.getActiveCampaign(merchantId);
  }

  @Post('draw/spin')
  spin(@Body() body: { merchantId: string; lineUserId: string; campaignId: string }) {
    return this.drawService.performDraw(body.merchantId, body.lineUserId, body.campaignId);
  }
}
