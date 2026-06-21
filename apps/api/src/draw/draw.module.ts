import { Module } from '@nestjs/common';
import { DrawController } from './draw.controller';
import { DrawService } from './draw.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [DrawController],
  providers: [DrawService],
  exports: [DrawService],
})
export class DrawModule {}
