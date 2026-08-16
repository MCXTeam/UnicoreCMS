import { EMAIL_ACTIVATION_TTL_MINUTES, PASSWORD_RESET_TTL_MINUTES, SafeCron } from '@common';
import { CronExpression } from '@nestjs/schedule';
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

  @SafeCron(CronExpression.EVERY_HOUR, 'email-cleanup')
  async clean() {
    const prClean = await this.prRepository.findBy({
      created: LessThan(moment().utc().subtract(PASSWORD_RESET_TTL_MINUTES, 'minutes').toDate()),
    });
    const eaClean = await this.eaRepository.findBy({
      created: LessThan(moment().utc().subtract(EMAIL_ACTIVATION_TTL_MINUTES, 'minutes').toDate()),
    });

    await this.prRepository.remove(prClean);
    await this.eaRepository.remove(eaClean);
  }
}
