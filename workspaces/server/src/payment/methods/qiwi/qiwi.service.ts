import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentHandlerService } from '../core/payment-handler.service';
import { QiwiModule } from './qiwi.module';
import * as ipRangeCheck from "ip-range-check";
import * as crypto from 'crypto';
import { PaymentStatuses, PaymentStatusesRedirect } from 'src/payment/enums/payment-statuses.enum';

@Injectable()
export class QiwiService implements PaymentCoreService {
  private ips = ['79.142.16.0/20', '195.189.100.0/22', '91.232.230.0/23', '91.213.51.0/24']

  constructor(private paymentHandler: PaymentHandlerService) { }

  async createLink(user: User, input: PaymentCreateDto): Promise<PaymentLink> {
    const payment = await this.paymentHandler.create(QiwiModule.id, input.amount, user)

    const url = new URL('https://oplata.qiwi.com/create');
    url.searchParams.append('publicKey', envConfig.qiwiPublicKey)
    url.searchParams.append('billId', String(payment.id))
    url.searchParams.append('amount', String(input.amount))
    url.searchParams.append('email', user.email)
    url.searchParams.append('successUrl', `${envConfig.apiBaseurl}/payment/redirect/${PaymentStatusesRedirect.SUCCESS}/${QiwiModule.id}`)

    return { link: url.href }
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    if (!ipRangeCheck(ip, this.ips))
      return PaymentResp.BadIp

    if (input.status.value != PaymentStatuses.PAID)
      return

    const sign = crypto.createHmac('sha256', envConfig.qiwiSecretKey).update([input.amount.currency, input.amount.value, input.billId, input.siteId, input.status.value].join('|')).digest('hex')

    if (sign != input.sign)
      return PaymentResp.WrongSign

    if (!await this.paymentHandler.handler(input.billId, null, input.amount))
      return PaymentResp.WrongPayID

    return PaymentResp.OK;
  }
}
