import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { LineModule } from '../line/line.module';
import { ServicesModule } from '../services/services.module';
import { StaffModule } from '../staff/staff.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { QueueModule } from '../queue/queue.module';
import { CouponsModule } from '../coupons/coupons.module';
import { FormsModule } from '../forms/forms.module';
import { OrdersModule } from '../orders/orders.module';
import { DrawModule } from '../draw/draw.module';

@Module({
  imports: [
    BookingsModule,
    LineModule,
    ServicesModule,
    StaffModule,
    LoyaltyModule,
    ReviewsModule,
    QueueModule,
    CouponsModule,
    FormsModule,
    OrdersModule,
    DrawModule,
  ],
  controllers: [PublicController],
})
export class PublicModule {}
