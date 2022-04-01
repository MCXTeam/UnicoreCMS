import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { userPermissionCheck, UsersService } from 'src/admin/users/users.service';
import { Repository } from 'typeorm';
import { BanInput } from './dto/ban.input';
import { Ban } from './entities/ban.entity';
import * as moment from 'moment';
import { User } from 'src/admin/users/entities/user.entity';
import { BanFromAdminInput } from './dto/ban-from-admin.input';
import { MomentWrapper } from '@common';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';

@Injectable()
export class BansService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(Ban)
    private bansRepository: Repository<Ban>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private configService: ConfigService,
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
    else ban.expires = null

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

    if (input.expires) ban.expires = this.moment(input.expires).utc().toDate();
    else ban.expires = null

    if (!userPermissionCheck(ban.user, actor)) throw new ForbiddenException()

    if (!ban.user || !ban.actor || ban.user.uuid == kernel.uuid) throw new BadRequestException();

    return this.bansRepository.save(ban);
  }

  async unban(user: User) {
    if (!user.ban)
      throw new NotFoundException()

    const config = await this.configService.load()
    
    // Price calc
    if (user.real < config[ConfigField.UnbanPrice])
      throw new BadRequestException()

    user.real -= config[ConfigField.UnbanPrice] as number
    
    await this.usersRepository.save(user)
    await this.bansRepository.delete({ user })
    return true
  }

  async remove(uuid: string): Promise<void> {
    await this.bansRepository.delete({ user: { uuid: uuid } });
  }
}
