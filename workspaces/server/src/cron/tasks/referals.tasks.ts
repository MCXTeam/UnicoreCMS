import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from 'src/admin/config/config.service';
import { PlaytimeService } from 'src/game/cabinet/playtime/playtime.service';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { IsNull, Repository } from 'typeorm';
import * as _ from 'lodash'
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
  ) { }

  @Cron(CronExpression.EVERY_HOUR)
  async clean() {
    const config = await this.configService.load()
    const referals = await this.referalsRepository.find({
      where: {
        rewarded: IsNull()
      },
      relations: ['user', 'inviter']
    });

    for (const ref of referals) {
      const pt = await this.playtimeService.findOneByUser(ref.user)

      if (_.sumBy(pt, (pt) => pt.time) >= config[ConfigField.ReferalTrigger]) {
        await this.usersRepository.increment({ uuid: ref.user.uuid }, "real", Number(config[ConfigField.ReferalRewardPlayer]))
        await this.usersRepository.increment({ uuid: ref.inviter.uuid }, "real", Number(config[ConfigField.ReferalReward]))
        await this.referalsRepository.update({ user: { uuid: ref.user.uuid } }, { rewarded: true })
      }
    }
  }
}
