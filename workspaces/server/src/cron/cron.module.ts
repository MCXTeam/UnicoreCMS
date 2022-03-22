import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { History } from 'src/game/cabinet/history/entities/history.entity';
import { OnlineModule } from 'src/game/servers/online/online.module';
import { ServersModule } from 'src/game/servers/servers.module';
import { CartItemKit } from 'src/game/store/cart/entities/cart-item-kit.entity';
import { CartItem } from 'src/game/store/cart/entities/cart-item.entity';
import { CartTasks } from './tasks/cart.tasks';
import { HistoryTasks } from './tasks/history.tasks';
import { OnlineTasks } from './tasks/online.tasks';
import { TokenTasks } from './tasks/tokens.tasks';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken, History, CartItem, CartItemKit]), ServersModule, OnlineModule],
  providers: [TokenTasks, HistoryTasks, OnlineTasks, CartTasks],
})
export class CronModule {}
