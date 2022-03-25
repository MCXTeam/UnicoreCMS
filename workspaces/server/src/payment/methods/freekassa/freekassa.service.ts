import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentHandlerService } from '../core/payment-handler.service';
import { FreekassaModule } from './freekassa.module';
import * as crypto from 'crypto';

@Injectable()
export class FreekassaService implements PaymentCoreService {
  private ips = ['168.119.157.136', '168.119.60.227', '138.201.88.124', '178.154.197.79']

  constructor(private paymentHandler: PaymentHandlerService) { }

  async createLink(user: User, input: PaymentCreateDto): Promise<PaymentLink> {
    const payment = await this.paymentHandler.create(FreekassaModule.id, input.amount, user)

    const sign = crypto.createHash('md5').update([
      envConfig.freekassaMerchantID,
      input.amount,
      envConfig.freekassaSecretKey,
      'RUB',
      payment.id
    ].join(':')).digest('hex')

    const url = new URL('https://pay.freekassa.ru/');
    url.searchParams.append('m', envConfig.freekassaMerchantID)
    url.searchParams.append('oa', String(input.amount))
    url.searchParams.append('currency', 'RUB')
    url.searchParams.append('o', String(payment.id))
    url.searchParams.append('em', user.email)
    url.searchParams.append('s', sign)

    return { link: url.href }
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    if (!this.ips.find(i => i == ip))
      return PaymentResp.BadIp

    const sign = crypto.createHash('md5').update([envConfig.freekassaMerchantID, input.AMOUNT, envConfig.freekassaSecretKeySecond, input.MERCHANT_ORDER_ID].join(':')).digest('hex')

    if (sign != input.SIGN)
      return PaymentResp.WrongSign

    if (!await this.paymentHandler.handler(input.MERCHANT_ORDER_ID, input.intid))
      return PaymentResp.WrongPayID

    return PaymentResp.OK;
  }
}
