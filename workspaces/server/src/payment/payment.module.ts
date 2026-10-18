import { Module, OnModuleInit } from '@nestjs/common';
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
import { modulePaymentModules } from 'src/modules/runtime';
import { GatewayModule } from './methods/gateways/gateway.module';
import { PaymentSettingsModule } from './settings/payment-settings.module';

const register = modulePaymentModules().filter((method) => method.enabled);

@Module({
  imports: [PaymentSettingsModule, AnypayModule, UnitpayModule, EnotioModule, PayokModule, CentappModule, GatewayModule, ...register, TypeOrmModule.forFeature([Payment]), BonusesModule],
  providers: [PaymentService],
  exports: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule implements OnModuleInit {
  constructor(private paymentService: PaymentService) {}

  onModuleInit() {
    this.paymentService.setMethods(register.map((method) => method.id));
  }
}
