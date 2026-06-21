import { IsString, IsUUID, IsDateString, Matches, IsOptional, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  merchantId: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  staffId: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM format' })
  startTime: string;

  @IsString()
  @MaxLength(50)
  customerName: string;

  @IsString()
  @Matches(/^09\d{8}$/, { message: 'customerPhone must be a valid TW mobile number' })
  customerPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsString()
  lineUserId: string;
}

export class UpdateBookingStatusDto {
  @IsString()
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}
