import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { PaymentCoreModule } from '../core/payment-core.module';
import { PaymentHandlerModule } from '../core/payment-handler.module';
import { CentappController } from './centapp.controller';
import { CentappService } from './centapp.service';

@Module({
  imports: [PaymentHandlerModule],
  providers: [CentappService],
  controllers: [CentappController],
})
export class CentappModule implements PaymentCoreModule {
  static id = "centapp"
  static enabled = envConfig.centappEnabled;
}
