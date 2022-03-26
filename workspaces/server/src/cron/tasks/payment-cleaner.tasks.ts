import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Payment } from 'src/payment/entities/payment.entity';
import { LessThan, Repository } from 'typeorm';

export class PaymentTasks {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async clean() {
    const payments = await this.paymentsRepository.find({
      updated: LessThan(moment().subtract(7, 'days').toDate()),
    });

    await this.paymentsRepository.remove(payments);
  }
}
