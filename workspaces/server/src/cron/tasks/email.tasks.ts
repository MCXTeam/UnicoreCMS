import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { EmailActivation } from 'src/admin/email/entities/email-activation.entity';
import { PasswordReset } from 'src/admin/email/entities/password-reset.entity';
import { LessThan, Repository } from 'typeorm';

export class EmailTasks {
  constructor(
    @InjectRepository(PasswordReset)
    private prRepository: Repository<PasswordReset>,
    @InjectRepository(EmailActivation)
    private eaRepository: Repository<EmailActivation>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async clean() {
    const prClean = await this.prRepository.find({
      created: LessThan(moment().utc().subtract(1, 'hour').toDate()),
    });
    const eaClean = await this.eaRepository.find({
      created: LessThan(moment().utc().subtract(1, 'hour').toDate()),
    });

    await this.prRepository.remove(prClean);
    await this.eaRepository.remove(eaClean);
  }
}
