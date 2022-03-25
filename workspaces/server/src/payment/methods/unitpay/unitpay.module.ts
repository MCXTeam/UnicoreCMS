import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { PaymentCoreModule } from '../core/payment-core.module';
import { PaymentHandlerModule } from '../core/payment-handler.module';
import { UnitpayController } from './unitpay.controller';
import { UnitpayService } from './unitpay.service';

@Module({
  imports: [PaymentHandlerModule],
  providers: [UnitpayService],
  controllers: [UnitpayController],
})
export class UnitpayModule implements PaymentCoreModule {
  static id = "unitpay"
  static enabled = envConfig.unitpayEnabled;
}
