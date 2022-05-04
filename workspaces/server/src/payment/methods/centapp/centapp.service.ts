import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PaymentResp } from 'src/payment/enums/payment-resp.enum';
import { envConfig } from 'unicore-common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { PaymentCoreService, PaymentLink } from '../core/payment-core.service';
import { PaymentHandlerService } from '../core/payment-handler.service';
import { CentappModule } from './centapp.module';
import axios from 'axios'
import * as crypto from 'crypto';

@Injectable()
export class CentappService implements PaymentCoreService {
  constructor(private paymentHandler: PaymentHandlerService) { }

  async createLink(user: User, input: PaymentCreateDto, ip: string): Promise<PaymentLink> {
    const payment = await this.paymentHandler.create(CentappModule.id, input.amount, user, ip)
    const axiosConfig = { headers: { 'Authorization': 'Bearer ' + envConfig.centappToken } }

    try {
      const link = await axios.post('https://cent.app/api/v1/bill/create', {
        amount: input.amount,
        order_id: payment.id,
        shop_id: envConfig.centappShopID
      }, axiosConfig).then(res => res.data.link_page_url)

      return { link }
    } catch {
      throw new ServiceUnavailableException()
    }
  }

  async handler(ip: string, input: any): Promise<PaymentResp> {
    const sign = crypto.createHash('md5').update([input.OutSum, input.InvId, envConfig.centappToken].join(':')).digest('hex').toUpperCase()

    if (sign != input.SignatureValue)
      return PaymentResp.WrongSign

    if (!await this.paymentHandler.handler(input.InvId, input.TrsId))
      return PaymentResp.WrongPayID

    return PaymentResp.OK;
  }
}
