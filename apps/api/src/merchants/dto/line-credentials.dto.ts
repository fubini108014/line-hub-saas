import { IsString, MinLength } from 'class-validator';

export class LineCredentialsDto {
  @IsString()
  channelId: string;

  @IsString()
  channelSecret: string;

  @IsString()
  @MinLength(10)
  accessToken: string;

  @IsString()
  liffId: string;
}
