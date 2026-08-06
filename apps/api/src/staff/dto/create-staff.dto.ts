import { IsString, IsOptional, IsArray, IsUUID, IsBoolean, MaxLength } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialty?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;
}

export class AssignServicesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];
}
