import { Module } from '@nestjs/common';
import { PlaytimeListService } from './playtime-list.service';
import { PlaytimeListController } from './playtime-list.controller';

@Module({
  providers: [PlaytimeListService],
  controllers: [PlaytimeListController],
})
export class PlaytimeListModule {}
