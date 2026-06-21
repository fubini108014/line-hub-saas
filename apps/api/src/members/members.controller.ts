import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { MembersService } from './members.service';

@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.membersService.findAll(m.id);
  }

  @Get(':id')
  findOne(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.membersService.findOne(m.id, id);
  }
}
