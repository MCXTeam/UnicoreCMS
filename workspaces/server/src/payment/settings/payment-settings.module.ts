import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentSetting } from './payment-setting.entity';
import { PaymentSettingsService } from './payment-settings.service';
import { ExchangeRatesService } from './exchange-rates.service';
import { PaymentSettingsController } from './payment-settings.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PaymentSetting])],
  providers: [PaymentSettingsService, ExchangeRatesService],
  exports: [PaymentSettingsService, ExchangeRatesService],
  controllers: [PaymentSettingsController],
})
export class PaymentSettingsModule {}
