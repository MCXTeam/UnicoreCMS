import { Module, OnModuleInit } from '@nestjs/common';
import { FreekassaModule } from './methods/freekassa/freekassa.module';
import { QiwiModule } from './methods/qiwi/qiwi.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { BonusesModule } from './bonuses/bonuses.module';
import { AnypayModule } from './methods/anypay/anypay.module';
import { CentappModule } from './methods/centapp/centapp.module';
import { EnotioModule } from './methods/enotio/enotio.module';
import { PayokModule } from './methods/payok/payok.module';
import { UnitpayModule } from './methods/unitpay/unitpay.module';

const register = [AnypayModule, UnitpayModule, FreekassaModule, EnotioModule, PayokModule, QiwiModule, CentappModule].filter(method => method.enabled)

@Module({
  imports: [...register, TypeOrmModule.forFeature([Payment]), FreekassaModule, QiwiModule, BonusesModule],
  providers: [PaymentService],
  exports: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule implements OnModuleInit {
  constructor (private paymentService: PaymentService) {}

  onModuleInit() {
    this.paymentService.setMethods(register.map(method => method.id))
  }
}
