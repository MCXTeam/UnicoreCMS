import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineModule } from 'src/game/servers/online/online.module';
import { PaymentModule } from 'src/payment/payment.module';
import { StoreModule } from 'src/game/store/store.module';
import { User } from '../users/entities/user.entity';
import { OnlinesRecord } from 'src/game/servers/online/entities/onlines-record.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { History } from 'src/game/cabinet/history/entities/history.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([OnlinesRecord, User, History, Payment]),
    OnlineModule, PaymentModule, StoreModule
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
