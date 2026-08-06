import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';
import { KEEP_FOREVER, KEEP_HISTORY_DAYS } from '@common';
import { History } from 'src/game/cabinet/history/entities/history.entity';
import { LessThan, Repository } from 'typeorm';

export class HistoryTasks {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async clean() {
    const config = await this.configService.load();
    const raw = Number(config[ConfigField.KeepHistoryDays]);
    const days = Number.isFinite(raw) && raw >= KEEP_FOREVER ? raw : KEEP_HISTORY_DAYS;

    if (days === KEEP_FOREVER) return;

    const historyClean = await this.historyRepository.findBy({
      created: LessThan(moment().utc().subtract(days, 'days').toDate()),
    });

    await this.historyRepository.remove(historyClean);
  }
}
