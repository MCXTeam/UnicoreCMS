import { SafeCron } from '@common';
import { hooks } from 'unicore-api';
import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from 'src/admin/config/config.service';
import { PlaytimeService } from 'src/game/cabinet/playtime/playtime.service';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { IsNull, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import _ from 'lodash';
import { ConfigField } from 'src/admin/config/config.enum';
import { User } from 'src/admin/users/entities/user.entity';

export class ReferalsTasks {
  constructor(
    @InjectRepository(Referal)
    private referalsRepository: Repository<Referal>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
    private playtimeService: PlaytimeService,
  ) {}

  @SafeCron(CronExpression.EVERY_HOUR, 'referals-reward')
  async clean() {
    const config = await this.configService.load();
    const referals = await this.referalsRepository.find({
      where: {
        rewarded: IsNull(),
      },
      relations: ['user', 'inviter'],
    });

    for (const ref of referals) {
      const playtime = await this.playtimeService.findOneByUser(ref.user);

      if (_.sumBy(playtime, (item) => item.time) >= Number(config[ConfigField.ReferalTrigger])) await this.reward(ref, config);
    }
  }

  @Transactional()
  private async reward(ref: Referal, config: Record<string, unknown>): Promise<void> {
    const claimed = await this.referalsRepository.update({ userUuid: ref.userUuid, rewarded: IsNull() }, { rewarded: true });

    if (!claimed.affected) return;

    await this.usersRepository.increment({ uuid: ref.user.uuid }, 'real', Number(config[ConfigField.ReferalRewardPlayer]));

    if (!(await hooks().allowed('referal.rewards', { inviterUuid: ref.inviter.uuid }))) return;

    await this.usersRepository.increment({ uuid: ref.inviter.uuid }, 'real', Number(config[ConfigField.ReferalReward]));
  }
}
