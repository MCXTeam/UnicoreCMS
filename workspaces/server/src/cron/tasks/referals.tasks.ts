import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
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
        ref.user.real += Number(config[ConfigField.ReferalRewardPlayer]);
        ref.inviter.real += Number(config[ConfigField.ReferalReward]);
        ref.rewarded = true

        await this.referalsRepository.save(ref)
        await this.usersRepository.save([ref.user, ref.inviter])
      }
    }
  }
}
