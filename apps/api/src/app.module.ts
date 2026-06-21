import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MerchantsModule } from './merchants/merchants.module';
import { ServicesModule } from './services/services.module';
import { StaffModule } from './staff/staff.module';
import { BusinessHoursModule } from './business-hours/business-hours.module';
import { BookingsModule } from './bookings/bookings.module';
import { WebhookModule } from './webhook/webhook.module';
import { LineModule } from './line/line.module';
import { MembersModule } from './members/members.module';
import { PublicModule } from './public/public.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { ReviewsModule } from './reviews/reviews.module';
import { QueueModule } from './queue/queue.module';
import { CouponsModule } from './coupons/coupons.module';
import { FormsModule } from './forms/forms.module';
import { OrdersModule } from './orders/orders.module';
import { DrawModule } from './draw/draw.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost',
        port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || '6379') : 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    MerchantsModule,
    ServicesModule,
    StaffModule,
    BusinessHoursModule,
    BookingsModule,
    WebhookModule,
    LineModule,
    MembersModule,
    PublicModule,
    LoyaltyModule,
    ReviewsModule,
    QueueModule,
    CouponsModule,
    FormsModule,
    OrdersModule,
    DrawModule,
  ],
})
export class AppModule {}
