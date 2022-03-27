import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PaginateQuery, Paginated, paginate, FilterOperator } from 'nestjs-paginate';
import { UserInput } from './dto/user.input';
import * as bcrypt from 'bcrypt';
import * as _ from 'lodash'
import { Role } from '../roles/entities/role.entity';
import { CACHE_MANAGER, ConflictException, forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { ImportantRoles } from '../roles/emums/important-roles.enum';
import { PlaytimeService } from 'src/game/cabinet/playtime/playtime.service';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { UserPublicDto } from './dto/user-public.dto';
import { ReferalsService } from 'src/game/cabinet/referals/referals.service';
import { Cache } from 'cache-manager';
import { CacheKey } from '@common';
import { UserUpdateInput } from './dto/user-update.input';

export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
    @Inject(forwardRef(() => PlaytimeService))
    private playtimeService: PlaytimeService,
    private referalsService: ReferalsService
  ) { }

  private async rolesModificator(user: User) {
    const oldUser = { ...user }
    const banned = user.roles.find(role => role.id == ImportantRoles.Banned)
    const default_ = user.roles.find(role => role.id == ImportantRoles.Default)

    if (!banned && user.ban)
      user.roles.push(await this.rolesRepository.findOne(ImportantRoles.Banned))

    if (banned && !user.ban) {
      user.roles = user.roles.filter(role => !_.isEqual(role, banned))
    }

    if (!default_) {
      user.roles.push(await this.rolesRepository.findOne(ImportantRoles.Default))
    }


    if (!_.isEqual(oldUser, user))
      return this.usersRepository.save(user)

    return user
  }

  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.skin', 'skin')
      .where({
        username: Not('Kernel'),
      });

    const paginate_ = await paginate(query, queryBuilder, {
      sortableColumns: ['uuid', 'username', 'email', 'created'],
      searchableColumns: ['uuid', 'username', 'email', 'created'],
      defaultSortBy: [['created', 'DESC']],
      filterableColumns: {
        created: [FilterOperator.GTE, FilterOperator.LTE],
      },
    });

    return {
      ...paginate_,
      data: await Promise.all(paginate_.data.map(async user => this.rolesModificator(user)))
    }
  }

  async getById(uuid: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ uuid }, { relations });
    return this.rolesModificator(user)
  }

  async getByUsername(username: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ username }, { relations });
    return this.rolesModificator(user)
  }

  async getByEmail(email: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ email }, { relations });
    return this.rolesModificator(user)
  }

  async getByUsernameOrEmail(username_or_email: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: [{ username: username_or_email }, { email: username_or_email }],
      relations,
    });
    return this.rolesModificator(user)
  }

  async getAllUsers(): Promise<string[]> {
    var users = await this.cacheManager.get<string[]>(CacheKey.Users)
    if (users) return users

    const allUsers = await this.usersRepository.find({ select: ['username'] })
    return this.cacheManager.set(CacheKey.Playtime, allUsers.map(u => u.username), { ttl: 60 })
  }

  async getPublicUser(username: string): Promise<UserPublicDto> {
    const user = await this.getByUsername(username)
    if (!user || user.username == "Kernel") throw new NotFoundException()

    const playtimes = await this.playtimeService.findOneByUser(user)
    const referals = await this.referalsService.getReferals(user)
    const votes = await this.votesRepository.count({ where: { user }, relations: ['user'] })

    return new UserPublicDto({ ...user, playtimes, votes, referals })
  }

  async getKernel(): Promise<User> {
    return this.usersRepository.findOne({
      username: 'Kernel',
    });
  }

  async genKernel() {
    await this.usersRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        username: 'Kernel',
        password: '',
        activated: true,
      })
      .orIgnore()
      .execute();
  }

  async count(): Promise<number> {
    return this.usersRepository.count({
      username: Not('Kernel'),
    });
  }

  async create(input: UserInput): Promise<User> {
    const userExist = await this.usersRepository.findOne({
      where: [{ email: input.username }, { username: input.username }],
    });

    if (userExist) {
      throw new ConflictException();
    }

    const user = new User();

    user.email = input.email;
    user.username = input.username;
    user.superuser = input.superuser;
    user.password = bcrypt.hashSync(input.password, 10);
    user.activated = input.activated;

    user.perms = input.perms;

    if (!input.roles) input.roles = [];

    user.roles = await this.rolesRepository.find({
      id: In(input.roles),
    });

    if (!user.roles.find((role) => role.id === ImportantRoles.Default))
      user.roles.push(await this.rolesRepository.findOne(ImportantRoles.Default));

    return this.usersRepository.save(user);
  }

  async update(uuid: string, input: UserUpdateInput): Promise<User> {
    const user = await this.getById(uuid);

    if (!user)
      throw new NotFoundException();

    user.email = input.email;
    user.username = input.username;
    user.superuser = input.superuser;
    user.activated = input.activated;

    if (input.password)
      user.password = bcrypt.hashSync(input.password, 10);

    user.perms = input.perms;

    if (!input.roles) input.roles = [];

    user.roles = await this.rolesRepository.find({
      id: In(input.roles),
    });

    if (!user.roles.find((role) => role.id === ImportantRoles.Default))
      user.roles.push(await this.rolesRepository.findOne(ImportantRoles.Default));

    return this.usersRepository.save(user);
  }
}
