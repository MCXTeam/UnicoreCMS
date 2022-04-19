import { CacheKey } from '@common';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { Repository } from 'typeorm';
import { VotesGroupped } from './votes-groupped.interface';
import * as _ from 'lodash'
import { GrouppedPaginate } from '../groupped.dto';
import { paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class VotesListService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Vote) private votesRepo: Repository<Vote>
  ) { }

  async refresh() {
    const votes: VotesGroupped[] = _(await this.votesRepo.find({ relations: ['user'] }))
      .groupBy(v => v.user.uuid)
      .map((value) => ({
        user: value[0].user,
        total: value.length,
        updated: _(value).maxBy(pt => pt.created).created
      }))
      .orderBy(['total'], ['desc'])
      .value()

    return this.cacheManager.set(CacheKey.Votes, votes, { ttl: 60 });
  }

  async find(page: number) {
    if (page <= 0) page = 1; 

    const votes = await this.cacheManager.get<VotesGroupped[]>(CacheKey.Votes) ||  await this.refresh();
    const chunks = _.chunk(votes, 25)
    const data = chunks[page - 1] || []

    return new GrouppedPaginate({ data, meta: { page, total: chunks.length || 1 } })
  }

  async recent(limit: number) {
    if (limit > 20) limit = 20
    const data = await this.votesRepo.createQueryBuilder("vote")
      .leftJoinAndSelect("vote.user", "user")
      .leftJoinAndSelect("user.skin", "skin")
      .distinct(true)
      .take(limit)
      .getMany()

    return new GrouppedPaginate({ data })
  }
}
