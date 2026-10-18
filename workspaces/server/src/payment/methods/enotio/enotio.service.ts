import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { safeEqual } from '@common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentQuoteService } from '../core/payment-quote.service';
import { PaymentSettingsService } from '../../settings/payment-settings.service';
import { EnotioModule } from './enotio.module';
import * as crypto from 'crypto';

@Injectable()
export class EnotioService implements PaymentCoreService {
  constructor(private quotes: PaymentQuoteService, private settings: PaymentSettingsService) {}

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const { payment, amount, config } = await this.quotes.create(EnotioModule.id, input.amount, user, ip);

    const sign = crypto
      .createHash('md5')
      .update([config.merchantId, amount, config.secret, payment.id].join(':'))
      .digest('hex');

    const url = new URL('https://enot.io/pay');
    url.searchParams.append('m', config.merchantId);
    url.searchParams.append('oa', String(amount));
    url.searchParams.append('o', String(payment.id));
    url.searchParams.append('s', sign);

    return { link: url.href };
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    const config = (await this.settings.configuredGateway('enotio')).values;
    const sign = crypto
      .createHash('md5')
      .update([config.merchantId, input.amount, config.secretSecond, input.merchant_id].join(':'))
      .digest('hex');

    if (!safeEqual(sign, input.sign_2)) return PaymentResp.WrongSign;

    if (!(await this.quotes.settle('enotio', input.merchant_id, input.intid, input.amount))) return PaymentResp.WrongPayID;

    return PaymentResp.OK;
  }
}
