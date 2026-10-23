import { SafeCron } from '@common';
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { AccountRestrictionsService } from 'src/game/punishments/account-restrictions.service';

@Injectable()
export class BanTasks {
  constructor(private accounts: AccountRestrictionsService) {}

  @SafeCron(CronExpression.EVERY_10_MINUTES, 'ban-cleanup')
  async clean() {
    await this.accounts.cleanExpired();
  }
}
