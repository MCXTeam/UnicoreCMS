import { CacheKey, VOTES_RECENT_MAX } from '@common';
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { Repository } from 'typeorm';
import { VotesGroupped } from './votes-groupped.interface';
import * as _ from 'lodash';
import { GrouppedPaginate } from '../groupped.dto';
import { paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class VotesListService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, @InjectRepository(Vote) private votesRepo: Repository<Vote>) {}

  async refresh() {
    const votes: VotesGroupped[] = _(await this.votesRepo.find({ relations: ['user'] }))
      .groupBy((v) => v.user.uuid)
      .map((value) => ({
        user: value[0].user,
        total: value.length,
        updated: _(value).maxBy((pt) => pt.created).created,
      }))
      .orderBy(['total'], ['desc'])
      .value();

    return this.cacheManager.set(CacheKey.Votes, votes, 60 * 1000);
  }

  async find(page: number) {
    if (page <= 0) page = 1;

    const votes = (await this.cacheManager.get<VotesGroupped[]>(CacheKey.Votes)) || (await this.refresh());
    const chunks = _.chunk(votes, 25);
    const data = chunks[page - 1] || [];

    return new GrouppedPaginate({ data, meta: { page, total: chunks.length || 1 } });
  }

  async recent(limit: number) {
    limit = Math.min(Math.max(limit, 1), VOTES_RECENT_MAX);

    const data = await this.votesRepo
      .createQueryBuilder('vote')
      .leftJoinAndSelect('vote.user', 'user')
      .leftJoinAndSelect('user.skin', 'skin')
      .distinct(true)
      .take(limit)
      .getMany();

    return new GrouppedPaginate({ data });
  }
}
