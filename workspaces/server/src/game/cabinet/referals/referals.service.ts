import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { User } from 'src/admin/users/entities/user.entity';
import { Repository } from 'typeorm';
import { PlaytimeService } from '../playtime/playtime.service';
import { InviterDto } from './dto/inviter.dto';
import { ReferalDto } from './dto/referals.dto';
import { Referal } from './entities/referal.entity';
import * as _ from 'lodash'

@Injectable()
export class ReferalsService {
  constructor(
    @InjectRepository(Referal) private referalsRepo: Repository<Referal>,
    private playtimeService: PlaytimeService
  ) { }

  async getInviter(user: User) {
    const inviter = await this.referalsRepo.findOne({ where: { user }, relations: ['user', 'inviter'] })

    if (!inviter)
      throw new NotFoundException()

    return new InviterDto(inviter)
  }

  async getReferals(inviter: User) {
    const referals = await this.referalsRepo.find({ where: { inviter }, relations: ['user', 'inviter'] })
    const referalsTransform = await Promise.all(referals.map(async ref => instanceToPlain(new ReferalDto({
      ...ref,
      playtime: _.sumBy(await this.playtimeService.findOneByUser(ref.user), (pt) => pt.time)
    }))))

    return _.orderBy(referalsTransform, ['playtime', 'user.created'], ['desc', 'desc'])
  }
}
