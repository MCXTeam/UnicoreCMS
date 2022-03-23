import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { PlaytimeListService } from './playtime.service';

@Controller('players/playtime')
export class PlaytimeListController {
  constructor (private ptlServuce: PlaytimeListService) {}

  @Get()
  find(@Query('page', ParseIntPipe) page: number) {
    return this.ptlServuce.find(page)
  }
}
