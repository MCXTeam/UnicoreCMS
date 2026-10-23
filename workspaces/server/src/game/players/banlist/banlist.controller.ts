import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { BanListService } from './banlist.service';
import { PunishmentListInput } from '../../punishments/dto/punishment-management.input';

@Public()
@Controller('players/banlist')
export class BanListController {
  constructor(private banlistServuce: BanListService) {}

  @Get()
  find(@Query() query: PunishmentListInput) {
    return this.banlistServuce.find(query);
  }
}
