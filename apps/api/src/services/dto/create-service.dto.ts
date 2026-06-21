import { IsString, IsOptional, IsNumber, IsPositive, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(15)
  @Max(480)
  @Type(() => Number)
  durationMinutes: number;
}
