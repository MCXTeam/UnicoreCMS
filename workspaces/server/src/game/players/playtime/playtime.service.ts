import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Playtime } from 'src/game/cabinet/playtime/entities/playtime.entity';
import { Not, Repository } from 'typeorm';
import * as _ from 'lodash'
import { PlaytimeGroupped } from './playtime-groupped.interface';
import { CacheKey } from '@common';
import { GrouppedPaginate } from '../groupped.dto';

@Injectable()
export class PlaytimeListService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Playtime) private playtimeRepo: Repository<Playtime>
  ) { }

  async refresh() {
    const platimes: PlaytimeGroupped[] = _(await this.playtimeRepo.find({ where: { user: { username: Not('Kernel') }}, relations: ['user'] }))
      .groupBy(v => v.user.uuid)
      .map((value) => ({
        user: value[0].user,
        time: _(value).sumBy(pt => pt.time),
        updated: _(value).maxBy(pt => pt.updated).updated
      }))
      .orderBy(['time', 'updated'], ['desc', 'desc'])
      .value()

    return this.cacheManager.set(CacheKey.Playtime, platimes, { ttl: 60 });
  }

  async find(page: number) {
    if (page <= 0) page = 1; 

    const platimes = await this.cacheManager.get<PlaytimeGroupped[]>(CacheKey.Playtime) ||  await this.refresh();
    const chunks = _.chunk(platimes, 25)
    const data = chunks[page - 1] || []

    return new GrouppedPaginate({ data, meta: { page, total: chunks.length || 1 } })
  }
}
