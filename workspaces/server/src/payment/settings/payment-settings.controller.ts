import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { Permissions } from '../../admin/roles/decorators/permission.decorator';
import { AuditService } from '../../common/audit';
import { GATEWAYS } from './gateway-definitions';
import { ExchangeRatesService, RateSnapshot } from './exchange-rates.service';
import { PaymentSettingsService } from './payment-settings.service';

class GatewayInput {
  @IsBoolean() enabled: boolean;
  @IsObject() values: Record<string, string>;
  @IsOptional() @IsArray() @IsString({ each: true }) clearSecrets?: string[];
}

class RatesInput {
  @IsIn(['manual', 'cbr']) mode: 'manual' | 'cbr';
  @IsString() @Matches(/^[A-Z]{3}$/) baseCurrency: string;
  @IsObject() manualRates: Record<string, number>;
}

@Controller('admin/payment-settings')
export class PaymentSettingsController {
  constructor(private settings: PaymentSettingsService, private exchange: ExchangeRatesService, private audit: AuditService) {}

  @Permissions(['panel.config.read'])
  @Get()
  async find() {
    return {
      providers: await Promise.all(GATEWAYS.map((item) => this.settings.publicGateway(item.id))),
      rates: await this.settings.rates(),
      snapshot: await this.settings.read<RateSnapshot>('cbr', null),
    };
  }

  private record(request: any, id: string, fields: string[]) {
    this.audit.record({ ...this.audit.context(request), action: 'config.update', target: { type: 'config', id: `payments:${id}` }, meta: { fields } });
  }

  @Permissions(['panel.config.update'])
  @Patch('rates')
  async updateRates(@Body() body: RatesInput, @Req() request: any) {
    const result = await this.settings.updateRates(body);
    this.record(request, 'rates', ['mode', 'baseCurrency', 'manualRates']);
    return result;
  }

  @Permissions(['panel.config.update'])
  @Post('rates/refresh')
  async refreshRates() { return this.exchange.snapshot(true); }

  @Permissions(['panel.config.update'])
  @Patch(':id')
  async updateGateway(@Param('id') id: string, @Body() body: GatewayInput, @Req() request: any) {
    const result = await this.settings.updateGateway(id, body);
    this.record(request, id, ['enabled', ...Object.keys(body.values)]);
    return result;
  }
}
