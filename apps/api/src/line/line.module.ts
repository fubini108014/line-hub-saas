import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [MerchantsModule],
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
