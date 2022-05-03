import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { History } from 'src/game/cabinet/history/entities/history.entity';
import { LessThan, Repository } from 'typeorm';

export class HistoryTasks {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async clean() {
    const historyClean = await this.historyRepository.find({
      created: LessThan(moment().utc().subtract(30, 'days').toDate()),
    });
    await this.historyRepository.remove(historyClean);
  }
}
