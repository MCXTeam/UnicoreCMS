import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/admin/users/users.service';
import { Repository } from 'typeorm';
import { BanInput } from './dto/ban.input';
import { Ban } from './entities/ban.entity';
import * as moment from 'moment';

@Injectable()
export class BansService {
  constructor(
    @InjectRepository(Ban)
    private bansRepository: Repository<Ban>,
    private usersService: UsersService,
  ) {}

  findOne(uuid: string): Promise<Ban> {
    return this.bansRepository.findOne(uuid, {
      relations: ['user', 'actor'],
    });
  }

  async create(input: BanInput): Promise<Ban> {
    const ban = new Ban();
    const kernel = await this.usersService.getKernel();

    ban.reason = input.reason;
    ban.user = await this.usersService.getById(input.user_uuid);

    if (input.actor_uuid) {
      ban.actor = await this.usersService.getById(input.actor_uuid);
    } else {
      ban.actor = kernel;
    }

    if (input.expires) ban.expires = moment.unix(input.expires).toDate();

    if (!ban.user || !ban.actor || ban.user.uuid == kernel.uuid) throw new BadRequestException();

    return this.bansRepository.save(ban);
  }

  async remove(uuid: string): Promise<void> {
    await this.bansRepository.delete({ user: { uuid: uuid } });
  }
}
