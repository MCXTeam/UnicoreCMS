import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PaginateQuery, Paginated, paginate, FilterOperator } from 'nestjs-paginate';
import { UserInput } from './dto/user.input';
import * as bcrypt from 'bcrypt';
import * as _ from 'lodash'
import { Role } from '../roles/entities/role.entity';
import { BadRequestException, CACHE_MANAGER, ConflictException, ForbiddenException, forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { ImportantRoles } from '../roles/emums/important-roles.enum';
import { PlaytimeService } from 'src/game/cabinet/playtime/playtime.service';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { UserPublicDto } from './dto/user-public.dto';
import { ReferalsService } from 'src/game/cabinet/referals/referals.service';
import { Cache } from 'cache-manager';
import { CacheKey, DeleteManyInput } from '@common';
import { UserUpdateInput } from './dto/user-update.input';
import { matchPermission, transformPermissions } from '../roles/guards/permisson.guard';
import { Permission } from 'unicore-common';
import { SettingsService } from 'src/game/cabinet/settings/providers/settings.service';
import { PasswordChangeInput } from 'src/game/cabinet/settings/dto/password-change.input';
import { PasswordUpdateInput } from 'src/game/cabinet/settings/dto/password-update.input';
import { Transactional } from 'typeorm-transactional-cls-hooked';

export async function userPermissionCheck(user: User, actor: User) {
  if (actor.superuser) return true
  if (!actor.superuser && user.superuser) return false
  if (await matchPermission([[Permission.AdminUsersUpdate, Permission.AdminUsersDelete, Permission.AdminUsersDeleteMany, Permission.AdminUsersCreate], { or: true }], { user })) {
    const actorPerms = transformPermissions(actor).perms
    for (const perm in transformPermissions(user).perms) {
      if (!actorPerms.find(p => p == perm)) return false
    }
  }
  return true
}

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
    private referalsService: ReferalsService,
    private settingsService: SettingsService
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

  @Transactional()
  async getById(uuid: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ uuid }, { relations });
    if (!user) return null
    return this.rolesModificator(user)
  }

  @Transactional()
  async getByUsername(username: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ username }, { relations });
    if (!user) return null
    return this.rolesModificator(user)
  }

  @Transactional()
  async getByEmail(email: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ email }, { relations });
    if (!user) return null
    return this.rolesModificator(user)
  }

  @Transactional()
  async getByUsernameOrEmail(username_or_email: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: [{ username: username_or_email }, { email: username_or_email }],
      relations,
    });
    if (!user) return null
    return this.rolesModificator(user)
  }

  @Transactional()
  async getAllUsers(): Promise<string[]> {
    var users = await this.cacheManager.get<string[]>(CacheKey.Users)
    if (users) return users

    const allUsers = await this.usersRepository.find({ select: ['username'] })
    return this.cacheManager.set(CacheKey.Playtime, allUsers.map(u => u.username), { ttl: 60 })
  }

  @Transactional()
  async getPublicUser(username: string): Promise<UserPublicDto> {
    const user = await this.getByUsername(username)
    if (!user || user.username == "Kernel") throw new NotFoundException()

    const playtimes = await this.playtimeService.findOneByUser(user)
    const referals = await this.referalsService.getReferals(user)
    const votes = await this.votesRepository.count({ where: { user }, relations: ['user'] })

    return new UserPublicDto({ ...user, playtimes, votes, referals })
  }

  @Transactional()
  async getKernel(): Promise<User> {
    return this.usersRepository.findOne({
      username: 'Kernel',
    });
  }

  @Transactional()
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

  @Transactional()
  async count(): Promise<number> {
    return this.usersRepository.count({
      username: Not('Kernel'),
    });
  }

  @Transactional()
  async create(input: UserInput, actor: User = null): Promise<User> {
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

    if (actor) {
      if (!await userPermissionCheck(user, actor))
        throw new ForbiddenException()
    }

    return this.usersRepository.save(user);
  }

  @Transactional()
  async update(uuid: string, input: UserUpdateInput, actor: User = null): Promise<User> {
    const user = await this.getById(uuid);

    if (!user)
      throw new NotFoundException();

    user.email = input.email;
    user.username = input.username;
    user.superuser = input.superuser;
    user.activated = input.activated;
    user.perms = input.perms;

    if (!input.roles) input.roles = [];

    user.roles = await this.rolesRepository.find({
      id: In(input.roles),
    });

    if (!user.roles.find((role) => role.id === ImportantRoles.Default))
      user.roles.push(await this.rolesRepository.findOne(ImportantRoles.Default));

    if (actor) {
      if (!await userPermissionCheck(user, actor))
        throw new ForbiddenException()

      if (user.uuid == actor.uuid) {
        if (actor.superuser != user.superuser)
          throw new BadRequestException()

        if (!await matchPermission([Permission.AdminDashboard, Permission.AdminUsersUpdate], { user }))
          throw new BadRequestException()
      }
    }

    return this.usersRepository.save(user);
  }

  @Transactional()
  async updatePassord(uuid: string, input: PasswordUpdateInput, actor: User = null) {
    const user = await this.getById(uuid)
    if (!user) throw new NotFoundException()

    if (actor) {
      if (!await userPermissionCheck(user, actor))
        throw new ForbiddenException()
    }

    return this.settingsService.updatePassword(user, input)
  }

  @Transactional()
  async delete(uuid: string, actor: User = null) {
    const user = await this.getById(uuid)

    if (!user)
      throw new NotFoundException()

    if (actor) {
      if (!await userPermissionCheck(user, actor))
        throw new ForbiddenException()
    }

    return this.usersRepository.remove(user)
  }

  @Transactional()
  async deleteMany(input: DeleteManyInput, actor: User = null) {
    const users = await this.usersRepository.findByIds(input.items)

    if (actor) {
      for (const user of users)
        if (!await userPermissionCheck(user, actor))
          throw new ForbiddenException()
    }

    await this.usersRepository.remove(users)
    return true
  }
}
