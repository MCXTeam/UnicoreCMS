import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentHandlerService } from '../core/payment-handler.service';
import * as crypto from 'crypto';
import { PayokModule } from './payok.module';
import { envConfig } from 'unicore-common';

@Injectable()
export class PayokService implements PaymentCoreService {
  constructor(private paymentHandler: PaymentHandlerService) { }

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const payment = await this.paymentHandler.create(PayokModule.id, input.amount, user, ip)

    const params = {
      amount: input.amount,
      payment: payment.id,
      shop: envConfig.payokShopID,
      currency: 'RUB',
      desc: `Payment: #${payment.id} (${user.username})`,
    }

    const sign = crypto.createHash('md5').update([...Object.values(params), envConfig.payokSecretKey].join('|')).digest('hex')

    const url = new URL('https://payok.io/pay');
    for (const param in params) {
      url.searchParams.append(param, params[param])
    }

    url.searchParams.append('email', user.email)
    url.searchParams.append('sign', sign)

    return { link: url.href }
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    const sign = crypto.createHash('md5').update([envConfig.payokSecretKey, input.desc, input.currency, envConfig.payokShopID, input.payment_id, input.amount].join('|')).digest('hex')
  
    if (sign != input.sign)
      return PaymentResp.WrongSign

    if (!await this.paymentHandler.handler(input.payment_id))
      return PaymentResp.WrongPayID

    return PaymentResp.OK;
  }
}
