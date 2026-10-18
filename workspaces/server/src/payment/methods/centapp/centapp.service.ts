import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { safeEqual } from '@common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentQuoteService } from '../core/payment-quote.service';
import { PaymentSettingsService } from '../../settings/payment-settings.service';
import { CentappModule } from './centapp.module';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class CentappService implements PaymentCoreService {
  constructor(private quotes: PaymentQuoteService, private settings: PaymentSettingsService) {}

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const { payment, amount, config } = await this.quotes.create(CentappModule.id, input.amount, user, ip);
    const axiosConfig = { headers: { Authorization: 'Bearer ' + config.secret }, timeout: 10000 };

    try {
      const link = await axios
        .post(
          'https://cent.app/api/v1/bill/create',
          {
            amount: amount,
            order_id: payment.id,
            shop_id: config.shopId,
          },
          axiosConfig,
        )
        .then((res) => res.data.link_page_url);

      return { link };
    } catch {
      throw new ServiceUnavailableException();
    }
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    const config = (await this.settings.configuredGateway('centapp')).values;
    const sign = crypto.createHash('md5').update([input.OutSum, input.InvId, config.secret].join(':')).digest('hex').toUpperCase();

    if (!safeEqual(sign, String(input.SignatureValue || '').toUpperCase()) || input.Status == 'FAIL') return PaymentResp.WrongSign;

    if (!(await this.quotes.settle('centapp', input.InvId, input.TrsId, input.OutSum))) return PaymentResp.WrongPayID;

    return PaymentResp.OK;
  }
}
