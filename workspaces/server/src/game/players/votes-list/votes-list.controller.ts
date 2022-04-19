import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { VotesListService } from './votes-list.service';

@Public()
@Controller('players/votes-list')
export class VotesListController {
  constructor (private vlServuce: VotesListService) {}

  @Get()
  find(@Query('page', ParseIntPipe) page: number) {
    return this.vlServuce.find(page)
  }

  @Get("recent/:limit")
  recent(@Param('limit', ParseIntPipe) page: number) {
    return this.vlServuce.recent(page)
  }
}
