import { Module } from '@nestjs/common';
import { PayokService } from './payok.service';
import { PayokController } from './payok.controller';
import { PaymentCoreModule } from '../core/payment-core.module';
import { envConfig } from 'unicore-common';
import { PaymentHandlerModule } from '../core/payment-handler.module';

@Module({
  imports: [PaymentHandlerModule],
  providers: [PayokService],
  controllers: [PayokController],
})
export class PayokModule implements PaymentCoreModule {
  static id = "payok"
  static enabled = envConfig.payokEnabled;
}
