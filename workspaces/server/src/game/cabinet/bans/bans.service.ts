import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/admin/users/users.service';
import { Repository } from 'typeorm';
import { BanInput } from './dto/ban.input';
import { Ban } from './entities/ban.entity';
import * as moment from 'moment';
import { User } from 'src/admin/users/entities/user.entity';
import { BanFromAdminInput } from './dto/ban-from-admin.input';
import { MomentWrapper } from '@common';

@Injectable()
export class BansService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(Ban)
    private bansRepository: Repository<Ban>,
    private usersService: UsersService,
  ) { }

  findOne(uuid: string): Promise<Ban> {
    return this.bansRepository.findOne(uuid, {
      relations: ['user', 'actor'],
    });
  }

  async create(kernel: User, input: BanInput): Promise<Ban> {
    var ban = await this.bansRepository.findOne({ where: { user: { uuid: input.user_uuid } }, relations: ["user"] })

    if (!ban)
      ban = new Ban();

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

  async createFromAdmin(actor: User, input: BanFromAdminInput) {
    var ban = await this.bansRepository.findOne({ where: { user: { uuid: input.user_uuid } }, relations: ["user"] })
    const kernel = await this.usersService.getKernel();

    if (!ban)
      ban = new Ban();

    ban.reason = input.reason;
    ban.actor = actor
    ban.user = await this.usersService.getById(input.user_uuid);
    ban.expires = this.moment(input.expires).utc().toDate();

    if (!ban.user || !ban.actor || ban.user.uuid == kernel.uuid) throw new BadRequestException();

    return this.bansRepository.save(ban);
  }

  async unban(user: User) {
    const ban = await this.bansRepository.findOne({ where: { user }, relations: ["user"] })

    if (!ban)
      throw new NotFoundException()

    // Price calc
    await this.bansRepository.remove(ban)
    return true
  }

  async remove(uuid: string): Promise<void> {
    await this.bansRepository.delete({ user: { uuid: uuid } });
  }
}
