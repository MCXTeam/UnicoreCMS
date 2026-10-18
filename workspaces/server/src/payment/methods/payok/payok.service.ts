import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentQuoteService } from '../core/payment-quote.service';
import { PaymentSettingsService } from '../../settings/payment-settings.service';
import * as crypto from 'crypto';
import { PayokModule } from './payok.module';
import { envConfig } from 'unicore-common';
import { safeEqual } from '@common';

@Injectable()
export class PayokService implements PaymentCoreService {
  constructor(private quotes: PaymentQuoteService, private settings: PaymentSettingsService) {}

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const { payment, amount, config } = await this.quotes.create(PayokModule.id, input.amount, user, ip);

    const params = {
      amount: amount,
      payment: payment.id,
      shop: config.shopId,
      currency: 'RUB',
      desc: `Payment: #${payment.id} (${user.username})`,
    };

    const sign = crypto
      .createHash('md5')
      .update([...Object.values(params), config.secret].join('|'))
      .digest('hex');

    const url = new URL('https://payok.io/pay');
    for (const param in params) {
      url.searchParams.append(param, params[param]);
    }

    url.searchParams.append('email', user.email);
    url.searchParams.append('sign', sign);

    return { link: url.href };
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    const config = (await this.settings.gateway('payok')).values;
    const sign = crypto
      .createHash('md5')
      .update([config.secret, input.desc, input.currency, config.shopId, input.payment_id, input.amount].join('|'))
      .digest('hex');

    if (!safeEqual(sign, input.sign)) return PaymentResp.WrongSign;

    if (!(await this.quotes.settle('payok', input.payment_id, null, input.amount))) return PaymentResp.WrongPayID;

    return PaymentResp.OK;
  }
}
