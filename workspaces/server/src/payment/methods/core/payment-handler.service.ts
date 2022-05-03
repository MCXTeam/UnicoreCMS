import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/admin/users/entities/user.entity";
import { HistoryType } from "src/game/cabinet/history/enums/history-type.enum";
import { HistoryService } from "src/game/cabinet/history/history.service";
import { Bonus } from "src/payment/bonuses/entities/bonus.entity";
import { Payment } from "src/payment/entities/payment.entity";
import { PaymentStatuses } from "src/payment/enums/payment-statuses.enum";
import { LessThanOrEqual, Repository } from "typeorm";

export class PaymentHandlerService {
  constructor(
    private historyService: HistoryService,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Bonus) private bonusesRepo: Repository<Bonus>,
    @InjectRepository(User) private usersRepo: Repository<User>
  ) { }

  create(method: string, amount: number, user: User): Promise<Payment> {
    const payment = new Payment()

    payment.method = method
    payment.status = PaymentStatuses.WAITING
    payment.amount = amount
    payment.user = user

    return this.paymentsRepo.save(payment)
  }

  async handler(id: number, bill_id: string = null): Promise<boolean> {
    const payment = await this.paymentsRepo.findOne({ id, status: PaymentStatuses.WAITING }, { relations: ['user'] })

    if (!payment)
      return false

    payment.status = PaymentStatuses.PAID

    if (bill_id)
      payment.bill_id = bill_id

    const bonus = await this.bonusesRepo.findOne({ order: { amount: 'DESC' }, where: { amount: LessThanOrEqual(payment.amount) } })
    if (bonus)
      payment.user.real += payment.amount + (payment.amount * 100 / bonus.bonus)

    await this.historyService.create(HistoryType.Payment, null, payment.user, payment)
    await this.paymentsRepo.save(payment)
    await this.usersRepo.save(payment.user)

    return true
  }
}