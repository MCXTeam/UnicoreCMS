import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { safeEqual } from '@common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentQuoteService } from '../core/payment-quote.service';
import { PaymentSettingsService } from '../../settings/payment-settings.service';
import { UnitpayModule } from './unitpay.module';
import * as crypto from 'crypto';

@Injectable()
export class UnitpayService implements PaymentCoreService {
  private ips = ['31.186.100.49', '52.29.152.23', '52.19.56.234'];

  constructor(private quotes: PaymentQuoteService, private settings: PaymentSettingsService) {}

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const { payment, amount, config } = await this.quotes.create(UnitpayModule.id, input.amount, user, ip);

    const params = {
      sum: amount,
      account: payment.id,
      desc: `Payment: #${payment.id} (${user.username})`,
      currency: 'RUB',
    };

    const sign = crypto
      .createHash('sha256')
      .update([params.account, params.currency, params.desc, params.sum, config.secret].join('{up}'))
      .digest('hex');

    const url = new URL('https://unitpay.ru/pay/' + config.publicId);
    for (const param in params) {
      url.searchParams.append(param, params[param]);
    }

    url.searchParams.append('sign', sign);

    return { link: url.href };
  }

  async handler(ip: string, input: any): Promise<any> {
    const config = (await this.settings.gateway('unitpay')).values;
    if (!this.ips.find((i) => i == ip)) return { error: { message: PaymentResp.BadIp } };

    if (!input?.params || typeof input.params !== 'object') return { error: { message: PaymentResp.WrongSign } };

    const sign = crypto
      .createHash('sha256')
      .update(
        [
          input.method,
          ...Object.keys(input.params)
            .filter((k) => k != 'sign' && k != 'signature')
            .sort()
            .map((k) => input.params[k]),
          config.secret,
        ].join('{up}'),
      )
      .digest('hex');

    if (!safeEqual(sign, input.params.signature)) return { error: { message: PaymentResp.WrongSign } };

    if (input.method == 'pay') {
      if (!(await this.quotes.settle('unitpay', input.params.account, input.params.unitpayId, input.params.sum)))
        return { error: { message: PaymentResp.WrongPayID } };
    }

    return { result: { message: PaymentResp.OK } };
  }
}
