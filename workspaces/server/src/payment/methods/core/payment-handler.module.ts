import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/admin/users/entities/user.entity";
import { HistoryModule } from "src/game/cabinet/history/history.module";
import { Bonus } from "src/payment/bonuses/entities/bonus.entity";
import { Payment } from "src/payment/entities/payment.entity";
import { PaymentHandlerService } from "./payment-handler.service";

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Bonus, User]), HistoryModule],
  providers: [PaymentHandlerService],
  exports: [PaymentHandlerService]
})
export class PaymentHandlerModule {}