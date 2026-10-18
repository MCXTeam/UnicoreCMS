import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../admin/users/entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { PaymentHandlerService } from './payment-handler.service';
import { ExchangeRatesService } from '../../settings/exchange-rates.service';
import { PaymentSettingsService } from '../../settings/payment-settings.service';

export function paymentMinor(value: unknown): number | null {
  if (!['string', 'number'].includes(typeof value) || !/^\d+(?:\.\d{1,2}0*)?$/.test(String(value))) return null;
  const amount = Number(value);
  const minor = Math.round(amount * 100);
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

@Injectable()
export class PaymentQuoteService {
  constructor(
    private settings: PaymentSettingsService,
    private exchange: ExchangeRatesService,
    private handler: PaymentHandlerService,
    @InjectRepository(Payment) private repository: Repository<Payment>,
  ) {}

  async create(method: string, amount: number, user: User, ip: string) {
    if (paymentMinor(amount) === null) throw new BadRequestException('amount');
    const config = (await this.settings.configuredGateway(method, true)).values;
    const quote = await this.exchange.quote(amount, config.currency);
    const payment = await this.handler.create(method, amount, user, ip);
    Object.assign(payment, {
      provider_amount: quote.amount, provider_currency: quote.currency, base_currency: quote.baseCurrency,
      exchange_rate: quote.rate, exchange_date: quote.date,
    });
    await this.repository.update(payment.id, {
      provider_amount: payment.provider_amount, provider_currency: payment.provider_currency,
      base_currency: payment.base_currency, exchange_rate: payment.exchange_rate, exchange_date: payment.exchange_date,
    });
    return { payment, amount: quote.amount, config };
  }

  async settle(method: string, id: number, transactionId: string, amount: unknown, currency?: string): Promise<boolean> {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0 || paymentMinor(amount) === null) return false;
    const payment = await this.repository.findOneBy({ id: Number(id), method });
    if (!payment || paymentMinor(amount) !== paymentMinor(payment.provider_amount ?? payment.amount)) return false;
    if (currency && currency !== (payment.provider_currency || 'RUB')) return false;
    return this.handler.handler(payment.id, String(transactionId || payment.id), Number(payment.amount), method);
  }
}
