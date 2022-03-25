import { Module } from '@nestjs/common';
import { QiwiService } from './qiwi.service';
import { QiwiController } from './qiwi.controller';
import { PaymentCoreModule } from '../core/payment-core.module';
import { envConfig } from 'unicore-common';
import { PaymentHandlerModule } from '../core/payment-handler.module';

@Module({
  imports: [PaymentHandlerModule],
  providers: [QiwiService],
  controllers: [QiwiController],
})
export class QiwiModule implements PaymentCoreModule {
  static id = "qiwi"
  static enabled = envConfig.qiwiEnabled;
}
