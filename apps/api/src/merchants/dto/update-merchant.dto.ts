import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateMerchantDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
