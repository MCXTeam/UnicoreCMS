import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payment.entity';
import { PaymentHandlerModule } from '../core/payment-handler.module';
import { PaymentQuoteService } from '../core/payment-quote.service';
import { GatewayService } from './gateway.service';
import { GATEWAY_CONTROLLERS } from './gateway.controller';

@Global()
@Module({
  imports: [PaymentHandlerModule, TypeOrmModule.forFeature([Payment])],
  providers: [PaymentQuoteService, GatewayService],
  exports: [PaymentQuoteService],
  controllers: GATEWAY_CONTROLLERS,
})
export class GatewayModule {}
