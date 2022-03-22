import { Module } from '@nestjs/common';
import { MoneyService } from './money.service';
import { MoneyController } from './money.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Money } from './entities/money.entity';
import { ServersModule } from 'src/game/servers/servers.module';
import { HistoryModule } from '../history/history.module';
import UsersModule from 'src/admin/users/users.module';
import { ConfigModule } from 'src/admin/config/config.module';
import { User } from 'src/admin/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Money, User]), ServersModule, HistoryModule, UsersModule, ConfigModule],
  providers: [MoneyService],
  controllers: [MoneyController],
})
export class MoneyModule {}
