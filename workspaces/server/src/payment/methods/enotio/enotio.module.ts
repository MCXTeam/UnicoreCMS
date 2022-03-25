import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { PaymentCoreModule } from '../core/payment-core.module';
import { PaymentHandlerModule } from '../core/payment-handler.module';
import { EnotioController } from './enotio.controller';
import { EnotioService } from './enotio.service';

@Module({
  imports: [PaymentHandlerModule],
  providers: [EnotioService],
  controllers: [EnotioController],
})
export class EnotioModule implements PaymentCoreModule {
  static id = "enotio"
  static enabled = envConfig.enotioEnabled;
}
