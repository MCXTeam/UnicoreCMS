import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentHandlerService } from '../core/payment-handler.service';
import { EnotioModule } from './enotio.module';
import * as crypto from 'crypto';

@Injectable()
export class EnotioService implements PaymentCoreService {
  constructor(private paymentHandler: PaymentHandlerService) { }

  async createLink(user: User, input: PaymentCreateDto): Promise<PaymentLink> {
    const payment = await this.paymentHandler.create(EnotioModule.id, input.amount, user)

    const sign = crypto.createHash('md5').update([envConfig.enotioMerchantID, input.amount, envConfig.enotioSecretKey, payment.id].join(':')).digest('hex')

    const url = new URL('https://enot.io/pay');
    url.searchParams.append('m', envConfig.enotioMerchantID)
    url.searchParams.append('oa', String(input.amount))
    url.searchParams.append('o', String(payment.id))
    url.searchParams.append('s', sign)

    return { link: url.href }
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    const sign = crypto.createHash('md5').update([envConfig.enotioMerchantID, input.amount, envConfig.enotioSecretKeySecond, input.merchant_id].join(':')).digest('hex')

    if (sign != input.sign_2)
      return PaymentResp.WrongSign

    if (!await this.paymentHandler.handler(input.merchant_id, input.intid))
      return PaymentResp.WrongPayID

    return PaymentResp.OK;
  }
}
