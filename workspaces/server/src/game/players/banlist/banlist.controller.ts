import { Controller, Get } from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { BanListService } from './banlist.service';

@Controller('players/banlist')
export class BanListController {
  constructor (private banlistServuce: BanListService) {}

  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.banlistServuce.find(query)
  }
}
