import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { PaymentCoreModule } from '../core/payment-core.module';
import { PaymentHandlerModule } from '../core/payment-handler.module';
import { AnypayController } from './anypay.controller';
import { AnypayService } from './anypay.service';

@Module({
  imports: [PaymentHandlerModule],
  providers: [AnypayService],
  controllers: [AnypayController],
})
export class AnypayModule implements PaymentCoreModule {
  static id = "anypay"
  static enabled = envConfig.anypayEnabled;
}
