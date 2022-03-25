import { Module } from '@nestjs/common';
import { FreekassaService } from './freekassa.service';
import { FreekassaController } from './freekassa.controller';
import { PaymentCoreModule } from '../core/payment-core.module';
import { envConfig } from 'unicore-common';
import { PaymentHandlerModule } from '../core/payment-handler.module';

@Module({
  imports: [PaymentHandlerModule],
  providers: [FreekassaService],
  controllers: [FreekassaController],
})
export class FreekassaModule implements PaymentCoreModule {
  static id = "freekassa"
  static enabled = envConfig.freekassaEnabled;
}
