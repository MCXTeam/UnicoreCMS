import { MomentWrapper, VOTE_MIN_INTERVAL_MS } from '@common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { User } from 'src/admin/users/entities/user.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Vote } from '../../entities/vote.entity';

export class MonitoringHandlerService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    private configService: ConfigService,
    @InjectRepository(Vote) private votesRepo: Repository<Vote>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async handler(monitoring_id: string, username: string): Promise<boolean> {
    const cfg = await this.configService.load();

    return this.votesRepo.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { username }, lock: { mode: 'pessimistic_write' } });

      if (!user) return false;

      const since = cfg[ConfigField.VotesTwinkProtect]
        ? this.moment().startOf('day').toDate()
        : new Date(Date.now() - VOTE_MIN_INTERVAL_MS);

      const voted = await manager.findOne(Vote, {
        where: {
          monitoring: monitoring_id,
          user: { uuid: user.uuid },
          created: MoreThanOrEqual(since),
        },
      });

      if (voted) return false;

      const reward = currencyUtils.roundByType(configFieldNumber(cfg, ConfigField.MonitoringReward), SystemCurrency.VIRTAUL);

      const vote = new Vote();
      vote.monitoring = monitoring_id;
      vote.user = user;

      await manager.increment(User, { uuid: user.uuid }, 'virtual', reward);
      await manager.save(vote);

      return true;
    });
  }
}
