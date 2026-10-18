import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { envConfig } from 'unicore-common';
import { Payment } from '../../entities/payment.entity';
import { User } from '../../../admin/users/entities/user.entity';
import { PaymentStatuses } from '../../enums/payment-statuses.enum';
import { PaymentQuoteService, paymentMinor } from '../core/payment-quote.service';
import { GATEWAYS } from '../../settings/gateway-definitions';
import { PaymentSettingsService } from '../../settings/payment-settings.service';
import { CheckoutContext, Gateway, GatewayHttp, GatewayRequest } from './protocol';
import { cloudpayments, crystalpay, heleket, lava, platega, yookassa } from './invoice-gateways';
import { freekassa, webmoney, yoomoney } from './form-gateways';
import { tebex } from './tebex';

const adapters: Record<string, (config: Record<string, string>) => Gateway> = { platega, crystalpay, heleket, yookassa, cloudpayments, lava, freekassa, webmoney, yoomoney, tebex };

export const GATEWAY_IDS = Object.keys(adapters);

@Injectable()
export class GatewayService {
  constructor(
    private settings: PaymentSettingsService,
    private quotes: PaymentQuoteService,
    @InjectRepository(Payment) private repository: Repository<Payment>,
  ) {}

  private http: GatewayHttp = async (method, url, data, headers) => {
    const response = await axios.request({ method, url, data, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers }, timeout: 10000, maxRedirects: 0, maxContentLength: 2 * 1024 * 1024 });
    return response.data;
  };

  private async adapter(id: string, savedMode?: string, enabled = false) {
    if (!Object.prototype.hasOwnProperty.call(adapters, id)) throw new NotFoundException();
    const config = { ...(await this.settings.gateway(id, enabled)).values };
    if (savedMode) config.mode = savedMode;
    if (GATEWAYS.find((item) => item.id === id).fields.some((field) => field.required && !config[field.key])) throw new ServiceUnavailableException('payment_not_configured');
    return adapters[id](config);
  }

  private context(payment: Payment, user: User, ip: string): CheckoutContext {
    const base = `${envConfig.apiBaseurl.replace(/\/$/, '')}/payment/methods/${payment.method}`;
    return {
      payment, user, ip, callback: `${base}/handler`,
      success: `${envConfig.apiBaseurl}/payment/redirect/success/${payment.method}`,
      fail: `${envConfig.apiBaseurl}/payment/redirect/fail/${payment.method}`,
      resume: (id) => `${base}/resume/${encodeURIComponent(id)}`,
      form: (id) => `${base}/checkout/${encodeURIComponent(id)}`,
    };
  }

  async create(id: string, amount: number, user: User, ip: string) {
    const adapter = await this.adapter(id, undefined, true);
    const { payment } = await this.quotes.create(id, amount, user, ip);
    try {
      const result = await adapter.create(this.context(payment, user, ip), this.http);
      await this.repository.update(payment.id, { provider_id: result.id ?? null, provider_data: result.data ?? null });
      return { link: result.link };
    } catch { throw new ServiceUnavailableException('payment_create_failed'); }
  }

  async notification(id: string, request: GatewayRequest): Promise<unknown> {
    const adapter = await this.adapter(id);
    let result;
    try { result = await adapter.verify(request, this.http); }
    catch (error) {
      if (axios.isAxiosError(error)) throw new ServiceUnavailableException('payment_verification_unavailable');
      throw new BadRequestException('invalid_payment_notification');
    }
    if (!result.paid && !result.prerequest) return result.response ?? 'OK';
    const order = String(result.orderId ?? '');
    if (order && !/^\d+$/.test(order)) throw new BadRequestException('payment_order');
    const where = order ? { id: Number(order), method: id } : { provider_id: String(result.providerId || ''), method: id };
    const payment = await this.repository.findOne({ where, relations: ['user'] });
    if (!payment || (!order && !result.providerId)) throw new BadRequestException('payment_order');
    if (result.providerId && payment.provider_id !== String(result.providerId)) throw new BadRequestException('payment_invoice');
    if (result.userId && result.userId !== payment.user.uuid) throw new BadRequestException('payment_user');
    if (id === 'tebex' && payment.provider_data?.mode === 'headless' && ![payment.provider_data.packageId, payment.provider_data.packageIdent].filter(Boolean).includes(result.productId)) throw new BadRequestException('payment_package');
    const expectedAmount = payment.provider_amount ?? payment.amount;
    const expectedCurrency = payment.provider_currency || 'RUB';
    if (paymentMinor(result.amount) === null || paymentMinor(result.amount) !== paymentMinor(expectedAmount) || (id !== 'freekassa' && !result.currency) || (result.currency && result.currency !== expectedCurrency)) throw new BadRequestException('payment_amount');
    if (result.prerequest) return 'YES';
    if (!result.transactionId || !(await this.quotes.settle(id, payment.id, result.transactionId, result.amount, result.currency))) throw new BadRequestException('payment_order');
    return result.response ?? 'OK';
  }

  private async pending(id: string, token: string) {
    const payment = await this.repository.findOne({ where: { method: id, provider_id: token, status: PaymentStatuses.WAITING }, relations: ['user'] });
    if (!payment) throw new NotFoundException();
    return payment;
  }

  async resume(id: string, token: string) {
    const payment = await this.pending(id, token);
    if (id !== 'tebex' || payment.provider_data?.mode !== 'headless') throw new NotFoundException();
    const adapter = await this.adapter(id, payment.provider_data.mode);
    try {
      const result = await adapter.resume(this.context(payment, payment.user, payment.ip), this.http);
      await this.repository.update(payment.id, { provider_data: result.data });
      return result.link;
    } catch { throw new ServiceUnavailableException('payment_resume_failed'); }
  }

  async form(id: string, token: string) {
    const payment = await this.pending(id, token);
    const adapter = await this.adapter(id);
    if (!adapter.form) throw new NotFoundException();
    return adapter.form(this.context(payment, payment.user, payment.ip));
  }
}
