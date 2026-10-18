import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { decryptField, encryptField } from '../../common/crypto/encrypted-column';
import { PaymentSetting } from './payment-setting.entity';
import { DEFAULT_RATES, GATEWAYS, GatewaySettings, RateSettings, gatewayDefaults } from './gateway-definitions';

export const PAYMENT_SETTINGS_FIELD = 'payment-settings';

@Injectable()
export class PaymentSettingsService {
  constructor(@InjectRepository(PaymentSetting) private repository: Repository<PaymentSetting>) {}

  async read<T>(id: string, fallback: T): Promise<T> {
    const row = await this.repository.findOneBy({ id });
    return row ? JSON.parse(decryptField(row.value, PAYMENT_SETTINGS_FIELD, id)) : fallback;
  }

  async write(id: string, value: unknown): Promise<void> {
    await this.repository.save({ id, value: encryptField(JSON.stringify(value), PAYMENT_SETTINGS_FIELD, id) });
  }

  async gateway(id: string, enabled = false): Promise<GatewaySettings> {
    const definition = GATEWAYS.find((item) => item.id === id);
    if (!definition) throw new NotFoundException();
    const settings = await this.read(id, gatewayDefaults(definition));
    if (enabled && !settings.enabled) throw new NotFoundException();
    return settings;
  }

  async enabledIds(): Promise<string[]> {
    const values = await Promise.all(GATEWAYS.map(async (item) => (await this.gateway(item.id)).enabled ? item.id : null));
    return values.filter(Boolean);
  }

  async configuredGateway(id: string, enabled = false): Promise<GatewaySettings> {
    const settings = await this.gateway(id, enabled);
    const definition = GATEWAYS.find((item) => item.id === id);
    if (definition.fields.some((field) => field.required && !settings.values[field.key]?.trim())) throw new ServiceUnavailableException('payment_not_configured');
    return settings;
  }

  async publicGateway(id: string) {
    const definition = GATEWAYS.find((item) => item.id === id);
    const settings = await this.gateway(id);
    const values = { ...settings.values };
    const configured: Record<string, boolean> = {};
    for (const field of definition.fields) {
      if (!field.secret) continue;
      configured[field.key] = Boolean(values[field.key]);
      values[field.key] = '';
    }
    return { id, name: definition.name, docs: definition.docs, fields: definition.fields.map(({ env, ...field }) => field), ...settings, values, configured };
  }

  async updateGateway(id: string, input: GatewaySettings & { clearSecrets?: string[] }) {
    const definition = GATEWAYS.find((item) => item.id === id);
    if (!definition) throw new NotFoundException();
    if (typeof input.enabled !== 'boolean' || !input.values || Array.isArray(input.values)) throw new BadRequestException();
    const existing = await this.gateway(id);
    const allowed = new Set(definition.fields.map((field) => field.key));
    if (Object.keys(input.values).some((key) => !allowed.has(key))) throw new BadRequestException();
    const values = { ...existing.values };
    const clears = input.clearSecrets ?? [];
    if (!Array.isArray(clears) || clears.some((key) => !definition.fields.some((field) => field.key === key && field.secret))) throw new BadRequestException();
    for (const field of definition.fields) {
      const value = input.values[field.key];
      if (value !== undefined) {
        if (typeof value !== 'string' || value.length > 4096 || (field.options && !field.options.includes(value))) throw new BadRequestException(field.key);
        if (!field.secret || value) values[field.key] = value.trim();
      }
      if (clears.includes(field.key)) values[field.key] = '';
      if (input.enabled && field.required && !values[field.key]) throw new BadRequestException(field.key);
    }
    if (!/^[A-Z]{3}$/.test(values.currency) || (definition.currencies && !definition.currencies.includes(values.currency))) throw new BadRequestException('currency');
    if (input.enabled && id === 'tebex') {
      const required = values.mode === 'headless' ? ['publicToken', 'categoryId'] : ['projectId'];
      if (required.some((key) => !values[key])) throw new BadRequestException('tebex');
    }
    if (input.enabled && values.receipts === 'true' && ['vat', 'paymentSubject', 'paymentMode'].some((key) => !values[key])) throw new BadRequestException('receipt');
    if (id === 'webmoney' && input.enabled) {
      const purses = { Z: 'USD', E: 'EUR', R: 'RUB', U: 'UAH', K: 'KZT', B: 'BYN' };
      if (!/^[A-Z]\d{12}$/.test(values.purse) || purses[values.purse[0]] !== values.currency) throw new BadRequestException('purse');
    }
    await this.write(id, { enabled: input.enabled, values });
    return this.publicGateway(id);
  }

  async rates(): Promise<RateSettings> { return this.read('rates', DEFAULT_RATES); }

  async updateRates(input: RateSettings): Promise<RateSettings> {
    if (!['manual', 'cbr'].includes(input.mode) || input.baseCurrency !== 'RUB' || !input.manualRates || Array.isArray(input.manualRates)) throw new BadRequestException();
    const entries = Object.entries(input.manualRates);
    if (entries.length > 100 || entries.some(([key, value]) => !/^[A-Z]{3}$/.test(key) || typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1e12)) throw new BadRequestException();
    if (input.manualRates.RUB !== undefined && input.manualRates.RUB !== 1) throw new BadRequestException('RUB');
    const value: RateSettings = { mode: input.mode, baseCurrency: input.baseCurrency, manualRates: { ...input.manualRates, RUB: 1 } };
    if (value.mode === 'manual' && !value.manualRates[value.baseCurrency]) throw new BadRequestException('baseCurrency');
    await this.write('rates', value);
    return value;
  }
}
