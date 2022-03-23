import { Module } from '@nestjs/common';
import { ReferalsListModule } from './referals-list/referals-list.module';
import { VotesListModule } from './votes-list/votes-list.module';
import { PlaytimeListModule } from './playtime/playtime.module';
import { BanListModule } from './banlist/banlist.module';

@Module({
  imports: [ReferalsListModule, VotesListModule, PlaytimeListModule, BanListModule],
})
export class PlayersModule {}
