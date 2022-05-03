import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Ban } from 'src/game/cabinet/bans/entities/ban.entity';
import { IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class BanTasks {
  constructor(
    @InjectRepository(Ban)
    private bansRepository: Repository<Ban>,
  ) { }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async clean() {
    const expiresBans = await this.bansRepository.createQueryBuilder("ud")
      .where("ud.expires < :expires", { expires: moment().utc().toDate() })
      .andWhere({ expires: Not(IsNull()) })
      .getMany();


    await this.bansRepository.remove(expiresBans)
  }
}
