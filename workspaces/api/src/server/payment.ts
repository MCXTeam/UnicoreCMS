export interface PaymentLink {
  link: string
}

export interface PaymentCreateInput {
  amount: number
  method: string
}

export abstract class PaymentCoreModule {
  static id: string
  static enabled: boolean
}

export abstract class PaymentCoreService {
  abstract createLink(user: unknown, input: PaymentCreateInput, ip: string): Promise<PaymentLink>
  abstract handler(ip: string, input: unknown): Promise<unknown>
}
