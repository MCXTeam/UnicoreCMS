import { Inject, Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { VoteGift } from 'src/game/cabinet/votes/entities/vote-gift.entity';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { VotesGroupped } from 'src/game/players/votes-list/votes-groupped.interface';
import { Repository } from 'typeorm';
import _ from 'lodash';
import { MomentWrapper, SafeCron } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';

@Injectable()
export class VotesTasks {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
    @InjectRepository(VoteGift)
    private votesGiftsRepository: Repository<VoteGift>,
  ) {}

  @SafeCron(CronExpression.EVERY_30_MINUTES, 'votes-rewards')
  async clean() {
    const gifts = await this.votesGiftsRepository.find();

    if (!gifts.length) return;

    const votes: VotesGroupped[] = _(await this.votesRepository.find({ relations: ['user'] }))
      .filter((v) => !!v.user)
      .groupBy((v) => v.user.uuid)
      .map((value) => ({
        ids: value.map((v) => v.id),
        user: value[0].user,
        total: value.length,
        updated: _(value).maxBy((pt) => pt.created).created,
      }))
      .filter((vt) => !this.moment().isSame(this.moment(vt.updated), 'months'))
      .orderBy(['total'], ['desc'])
      .value();

    const ids = votes.map((v) => v.ids).flat();

    if (!ids.length) return;

    await this.votesRepository.delete(ids);

    for (const gift of gifts) {
      const winner = votes[gift.place - 1];

      if (!winner) continue;

      const bonus = currencyUtils.roundByType(gift.bonus, SystemCurrency.REAL);

      if (bonus > 0) await this.usersRepository.increment({ uuid: winner.user.uuid }, 'real', bonus);
    }
  }
}
