import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Ban } from 'src/game/cabinet/bans/entities/ban.entity';
import { Repository } from 'typeorm';
import { PaginatedBansDto } from './dto/paginated-bans.dto';

@Injectable()
export class BanListService {
  constructor(@InjectRepository(Ban) private bansRepository: Repository<Ban>) { }

  async find(query: PaginateQuery) {
    const qb = this.bansRepository
      .createQueryBuilder('ban')
      .leftJoinAndSelect('ban.actor', 'actor')
      .leftJoinAndSelect('ban.user', 'user')
      .leftJoinAndSelect('user.skin', 'skin')
      .leftJoinAndSelect('user.cloak', 'cloak')

    return new PaginatedBansDto(await paginate(query, qb, {
      sortableColumns: ['created'],
      searchableColumns: ['created'],
      defaultSortBy: [['created', 'DESC']],
      maxLimit: 25,
    }));
  }
}
