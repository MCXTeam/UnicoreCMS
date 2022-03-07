import { Module } from '@nestjs/common';
import { PlaytimeModule } from './playtime/playtime.module';
import { HistoryModule } from './history/history.module';
import { SkinModule } from './skin/skin.module';
import { ReferalsModule } from './referals/referals.module';
import { GiftsModule } from './gifts/gifts.module';
import { VotesModule } from './votes/votes.module';
import { SettingsModule } from './settings/settings.module';
import { BanModule } from './bans/bans.module';

@Module({
  imports: [PlaytimeModule, HistoryModule, SkinModule, ReferalsModule, GiftsModule, VotesModule, SettingsModule, BanModule],
})
export class CabinetModule {}
