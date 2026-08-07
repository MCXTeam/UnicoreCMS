import { MomentWrapper } from '@common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
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

      const votedToday = await manager.findOne(Vote, {
        where: {
          monitoring: monitoring_id,
          user: { uuid: user.uuid },
          created: MoreThanOrEqual(this.moment().startOf('day').toDate()),
        },
      });

      if (votedToday && cfg[ConfigField.VotesTwinkProtect]) return false;

      user.virtual += Number(cfg[ConfigField.MonitoringReward]);

      const vote = new Vote();
      vote.monitoring = monitoring_id;
      vote.user = user;

      await manager.save(user);
      await manager.save(vote);

      return true;
    });
  }
}
