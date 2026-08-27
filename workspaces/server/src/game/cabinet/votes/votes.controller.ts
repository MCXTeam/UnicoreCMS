import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { VirtualCurrencyUserUpdate } from './dto/virtual-cur-user-update.input';
import { VoteGiftInput } from './dto/vote-gift.input';
import { VoteGift } from './entities/vote-gift.entity';
import { VotesService } from './votes.service';

@Controller('cabinet/votes')
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Public()
  @Get('monitorings')
  find() {
    return this.votesService.getMonitorings();
  }

  @Get('gifts')
  findAll(): Promise<VoteGift[]> {
    return this.votesService.find();
  }

  @Permissions(['panel.access', 'panel.votes.create'])
  @Post('gifts')
  create(@Body() body: VoteGiftInput) {
    return this.votesService.create(body);
  }

  @Permissions(['panel.access', 'panel.votes.update'])
  @Patch('gifts/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: VoteGiftInput) {
    return this.votesService.update(id, body);
  }

  @Permissions(['panel.access', 'panel.votes.delete'])
  @Delete('gifts/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.votesService.remove(id);
  }

  @Permissions(['panel.access', 'panel.users.balance.bonus'])
  @Patch('admin')
  updateVirtual(@Body() body: VirtualCurrencyUserUpdate) {
    return this.votesService.updateVirtual(body);
  }
}
