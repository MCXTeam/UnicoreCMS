import { Module } from '@nestjs/common';
import { ReferalsListModule } from './referals-list/referals-list.module';
import { VotesListModule } from './votes-list/votes-list.module';
import { PlaytimeListModule } from './playtime-list/playtime-list.module';
import { BanListModule } from './ban-list/ban-list.module';

@Module({
  imports: [ReferalsListModule, VotesListModule, PlaytimeListModule, BanListModule],
})
export class PlayersModule {}
