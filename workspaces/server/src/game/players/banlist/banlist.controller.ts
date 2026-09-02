import { Paginate, PaginateQuery } from '@common';
import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { BanListService } from './banlist.service';

@Public()
@Controller('players/banlist')
export class BanListController {
  constructor(private banlistServuce: BanListService) {}

  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.banlistServuce.find(query);
  }
}
