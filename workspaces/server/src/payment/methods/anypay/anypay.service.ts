import { Injectable } from '@nestjs/common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { User } from 'src/admin/users/entities/user.entity';
import { envConfig } from 'unicore-common';
import { safeEqual } from '@common';
import { AnypayModule } from './anypay.module';
import * as crypto from 'crypto';
import { PaymentStatuses, PaymentStatusesRedirect } from 'src/payment/enums/payment-statuses.enum';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { PaymentQuoteService } from '../core/payment-quote.service';
import { PaymentSettingsService } from '../../settings/payment-settings.service';

@Injectable()
export class AnypayService implements PaymentCoreService {
  private ips = ['185.162.128.38', '185.162.128.39', '185.162.128.88'];

  constructor(private quotes: PaymentQuoteService, private settings: PaymentSettingsService) {}

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const { payment, amount, config } = await this.quotes.create(AnypayModule.id, input.amount, user, ip);

    const params = {
      merchant_id: config.merchantId,
      pay_id: payment.id,
      amount: amount,
      currency: 'RUB',
      desc: `Payment: #${payment.id} (${user.username})`,
      success_url: `${envConfig.apiBaseurl}/payment/redirect/${PaymentStatusesRedirect.SUCCESS}/${AnypayModule.id}`,
      fail_url: `${envConfig.apiBaseurl}/payment/redirect/${PaymentStatusesRedirect.FAIL}/${AnypayModule.id}`,
      email: user.email,
    };

    const sign = crypto
      .createHash('sha256')
      .update(
        [
          params.merchant_id,
          params.pay_id,
          params.amount,
          params.currency,
          params.desc,
          params.success_url,
          params.fail_url,
          config.secret,
        ].join(':'),
      )
      .digest('hex');

    const url = new URL('https://anypay.io/merchant');
    for (const param in params) {
      url.searchParams.append(param, params[param]);
    }
    url.searchParams.append('sign', sign);

    return { link: url.href };
  }

  async handler(ip: string, input: any) {
    const config = (await this.settings.gateway('anypay')).values;
    if (!this.ips.find((i) => i == ip)) return PaymentResp.BadIp;

    const sign = crypto
      .createHash('sha256')
      .update(
        [input.currency, input.amount, input.pay_id, config.merchantId, PaymentStatuses.PAID, config.secret].join(':'),
      )
      .digest('hex');

    if (!safeEqual(sign, input.sign)) return PaymentResp.WrongSign;

    if (!(await this.quotes.settle('anypay', input.pay_id, input.transaction_id, input.amount))) return PaymentResp.WrongPayID;

    return PaymentResp.OK;
  }
}
