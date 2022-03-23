import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { VotesListService } from './votes-list.service';

@Controller('players/votes-list')
export class VotesListController {
  constructor (private vlServuce: VotesListService) {}

  @Get()
  find(@Query('page', ParseIntPipe) page: number) {
    return this.vlServuce.find(page)
  }
}
