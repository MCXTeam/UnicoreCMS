import { Module } from '@nestjs/common';
import { ServersModule } from './servers/servers.module';
import { DonateModule } from './donate/donate.module';
import { MoneyModule } from './cabinet/money/money.module';
import { StoreModule } from './store/store.module';
import { PlayersModule } from './players/players.module';
import { CabinetModule } from './cabinet/cabinet.module';

@Module({
  imports: [ServersModule, DonateModule, MoneyModule, StoreModule, PlayersModule, CabinetModule],
})
export class GameModule {}
