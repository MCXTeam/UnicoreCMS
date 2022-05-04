import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentHandlerService } from '../core/payment-handler.service';
import { UnitpayModule } from './unitpay.module';
import * as crypto from 'crypto';

@Injectable()
export class UnitpayService implements PaymentCoreService {
  private ips = ['31.186.100.49', '52.29.152.23', '52.19.56.234']

  constructor(private paymentHandler: PaymentHandlerService) { }

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const payment = await this.paymentHandler.create(UnitpayModule.id, input.amount, user, ip)

    const params = {
      sum: input.amount,
      account: payment.id,
      desc: `Payment: #${payment.id} (${user.username})`,
      currency: 'RUB'
    }

    const sign = crypto.createHash('sha256').update([params.account, params.currency, params.desc, params.sum, envConfig.unitpaySecretKey].join('{up}')).digest('hex')

    const url = new URL('https://unitpay.ru/pay/' + envConfig.unitpayPublicKey);
    for (const param in params) {
      url.searchParams.append(param, params[param])
    }

    url.searchParams.append('sign', sign)

    return { link: url.href }
  }

  async handler(ip: string, input: any): Promise<any> {
    if (!this.ips.find(i => i == ip))
      return { error: { message: PaymentResp.BadIp } }

    const sign = crypto.createHash('sha256').update([input.method, input.params, envConfig.unitpaySecretKey].join('{up}')).digest('hex')

    if (sign != input.params.signature)
      return { error: { message: PaymentResp.WrongSign } }

    if (input.method == 'pay') {
      if (!await this.paymentHandler.handler(input.params.account, input.params.unitpayId))
        return { error: { message: PaymentResp.WrongPayID } }
    }

    return { result: { message: PaymentResp.OK } }
  }
}
