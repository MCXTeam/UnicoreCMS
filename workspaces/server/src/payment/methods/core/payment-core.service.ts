import { User } from "src/admin/users/entities/user.entity";
import { PaymentResp } from "src/payment/enums/payment-resp.enum";
import { PaymentCreateDto } from "./dto/payment-create.dto";

export interface PaymentLink {
  link: string
}

export abstract class PaymentCoreService {
  abstract createLink(user: User, input: PaymentCreateDto): Promise<PaymentLink>
  abstract handler(ip: string, input: any): Promise<any>
}