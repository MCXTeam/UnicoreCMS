import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { PlaytimeListService } from './playtime.service';

@Public()
@Controller('players/playtime')
export class PlaytimeListController {
  constructor (private ptlServuce: PlaytimeListService) {}

  @Get()
  find(@Query('page', ParseIntPipe) page: number) {
    return this.ptlServuce.find(page)
  }
}
