import { Controller, Get } from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Public } from 'src/auth/decorators/public.decorator';
import { BanListService } from './banlist.service';

@Public()
@Controller('players/banlist')
export class BanListController {
  constructor (private banlistServuce: BanListService) {}

  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.banlistServuce.find(query)
  }
}
