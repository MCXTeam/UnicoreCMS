import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { VoteGift } from 'src/game/cabinet/votes/entities/vote-gift.entity';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { VotesGroupped } from 'src/game/players/votes-list/votes-groupped.interface';
import { Repository } from 'typeorm';
import * as _ from 'lodash'
import * as moment from 'moment';
import { User } from 'src/admin/users/entities/user.entity';

@Injectable()
export class VotesTasks {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
    @InjectRepository(VoteGift)
    private votesGiftsRepository: Repository<VoteGift>,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async clean() {
    const gifts = await this.votesGiftsRepository.find()

    if (!gifts.length) return

    const votes: VotesGroupped[] = _(await this.votesRepository.find({ relations: ['user'] }))
      .groupBy(v => v.user.uuid)
      .map((value) => ({
        ids: value.map(v => v.id),
        user: value[0].user,
        total: value.length,
        updated: _(value).maxBy(pt => pt.created).created
      }))
      .filter(vt => !moment().utc().isSame(moment(vt.updated).utc(), 'months'))
      .orderBy(['total'], ['desc'])
      .value()

    const users: User[] = []
    for (const gift of gifts) {
      if (votes[gift.place - 1]) {
        votes[gift.place - 1].user.real += gift.bonus
        users.push({
          ...votes[gift.place - 1].user,
          real: votes[gift.place - 1].user.real + gift.bonus
        })
      }
    }

    const ids = votes.map(v => v.ids).flat()

    if (users.length && ids.length) {
      await this.votesRepository.delete(ids)
      await this.usersRepository.save(users)
    }
  }
}
