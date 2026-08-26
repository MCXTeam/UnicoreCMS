import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PaginateQuery, Paginated, paginate, FilterOperator } from 'nestjs-paginate';
import { UserInput } from './dto/user.input';
import _ from 'lodash';
import { Role } from '../roles/entities/role.entity';
import { BadRequestException, ConflictException, ForbiddenException, forwardRef, Inject, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ImportantRoles } from '../roles/emums/important-roles.enum';
import { PlaytimeService } from 'src/game/cabinet/playtime/playtime.service';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { UserPublicDto } from './dto/user-public.dto';
import { ReferalsService } from 'src/game/cabinet/referals/referals.service';
import { randomUUID } from 'crypto';
import { PasswordService } from 'src/auth/password/password.service';
import { passwordAad } from 'src/auth/password/password-aad';
import { Cache } from 'cache-manager';
import {
  CacheKey,
  DeleteManyUuidInput,
  isBanActive,
  KERNEL_USERNAME,
  PUBLIC_USERS_CACHE_TTL_MS,
  PUBLIC_USERS_PAGE_SIZE,
  USER_SEARCH_LIMIT,
  USER_SEARCH_MAX_LIMIT,
} from '@common';
import { PublicUsersDto } from './dto/public-users.dto';
import { UserUpdateInput } from './dto/user-update.input';
import { matchPermission, transformPermissions } from '../roles/guards/permisson.guard';
import { isAdminPermission, Permission, UserField, USER_FIELDS } from 'unicore-common';
import { SettingsService } from 'src/game/cabinet/settings/providers/settings.service';
import { PasswordChangeInput } from 'src/game/cabinet/settings/dto/password-change.input';
import { PasswordUpdateInput } from 'src/game/cabinet/settings/dto/password-update.input';
import { Transactional } from 'typeorm-transactional';

function sameSet(left: string[] = [], right: string[] = []): boolean {
  return _.xor(left, right).length === 0;
}

function adminPermissions(user: Partial<User>): string[] {
  const resolved = transformPermissions({ ...user, perms: [...(user.perms || [])], roles: [...(user.roles || [])] });

  return (resolved.perms || []).filter(isAdminPermission);
}

async function canGrantAdminPermissions(actor: User): Promise<boolean> {
  return matchPermission([Permission.AdminUsersUpdateRolesAdmin], { user: actor });
}

export async function userPermissionCheck(user: User, actor: User) {
  if (actor.superuser) return true;
  if (!actor.superuser && user.superuser) return false;
  const actorPerms = transformPermissions({ ...actor, perms: [...(actor.perms || [])] }).perms;
  const targetPerms = transformPermissions({ ...user, perms: [...(user.perms || [])] }).perms;
  for (const perm of targetPerms) {
    if (!actorPerms.find((p) => p == perm)) return false;
  }
  return true;
}

export class UsersService {
  private readonly logger = new Logger(UsersService.name);

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
    private passwordService: PasswordService,
    private settingsService: SettingsService,
  ) {}

  private async requiredRole(id: ImportantRoles): Promise<Role> {
    const role = await this.rolesRepository.findOneBy({ id });

    if (!role) this.logger.error(`Обязательная роль "${id}" отсутствует в базе`);

    return role;
  }

  private async rolesModificator(user: User) {
    if (!user.roles) user.roles = [];

    const banned = user.roles.find((role) => role.id == ImportantRoles.Banned);
    const default_ = user.roles.find((role) => role.id == ImportantRoles.Default);
    const active = isBanActive(user.ban);
    let changed = false;

    if (!banned && active) {
      const role = await this.requiredRole(ImportantRoles.Banned);

      if (role) {
        user.roles.push(role);
        changed = true;
      }
    }

    if (banned && !active) {
      user.roles = user.roles.filter((role) => role.id != ImportantRoles.Banned);
      changed = true;
    }

    if (!default_) {
      const role = await this.requiredRole(ImportantRoles.Default);

      if (role) {
        user.roles.push(role);
        changed = true;
      }
    }

    if (changed) return this.usersRepository.save(user);

    return user;
  }

  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.skin', 'skin')
      .where({
        username: Not(KERNEL_USERNAME),
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
      data: await Promise.all(paginate_.data.map(async (user) => this.rolesModificator(user))),
    };
  }

  @Transactional()
  async getById(uuid: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { uuid }, relations });
    if (!user) return null;
    return this.rolesModificator(user);
  }

  @Transactional()
  async getByUsername(username: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username }, relations });
    if (!user) return null;
    return this.rolesModificator(user);
  }

  @Transactional()
  async getByEmail(email: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email }, relations });
    if (!user) return null;
    return this.rolesModificator(user);
  }

  @Transactional()
  async search(query: string, limit = USER_SEARCH_LIMIT): Promise<User[]> {
    const term = query.trim();

    if (!term) return [];

    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.skin', 'skin')
      .leftJoinAndSelect('user.cloak', 'cloak')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.username LIKE :term', { term: `%${term}%` })
      .andWhere('user.username != :kernel', { kernel: KERNEL_USERNAME })
      .orderBy('user.username', 'ASC')
      .take(Math.min(Math.max(limit, 1), USER_SEARCH_MAX_LIMIT))
      .getMany();
  }

  @Transactional()
  async getByUsernameOrEmail(username_or_email: string, relations?: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: [{ username: username_or_email }, { email: username_or_email }],
      relations,
    });
    if (!user) return null;
    return this.rolesModificator(user);
  }

  @Transactional()
  async getAllUsers(page = 1, limit = PUBLIC_USERS_PAGE_SIZE): Promise<PublicUsersDto> {
    const take = Math.min(Math.max(limit, 1), PUBLIC_USERS_PAGE_SIZE);
    const skip = (Math.max(page, 1) - 1) * take;
    const cacheKey = `${CacheKey.Users}:${skip}:${take}`;
    const cached = await this.cacheManager.get<PublicUsersDto>(cacheKey);

    if (cached) return cached;

    const [users, total] = await Promise.all([
      this.usersRepository
        .createQueryBuilder('user')
        .select('user.username', 'username')
        .where('user.username != :kernel', { kernel: KERNEL_USERNAME })
        .orderBy('user.created', 'ASC')
        .offset(skip)
        .limit(take)
        .getRawMany<{ username: string }>(),
      this.usersRepository.countBy({ username: Not(KERNEL_USERNAME) }),
    ]);

    const result = new PublicUsersDto({ items: users.map((user) => user.username), total });

    await this.cacheManager.set(cacheKey, result, PUBLIC_USERS_CACHE_TTL_MS);

    return result;
  }

  @Transactional()
  async getPublicUser(username: string): Promise<UserPublicDto> {
    const user = await this.getByUsername(username, ['roles']);
    if (!user || user.username == KERNEL_USERNAME) throw new NotFoundException();

    const playtimes = await this.playtimeService.findOneByUser(user);
    const referals = await this.referalsService.getReferals(user);
    const votes = await this.votesRepository.count({ where: { user: { uuid: user.uuid } }, relations: ['user'] });

    return new UserPublicDto({ ...user, playtimes, votes, referals });
  }

  @Transactional()
  async getKernel(): Promise<User> {
    return this.usersRepository.findOneBy({
      username: KERNEL_USERNAME,
    });
  }

  @Transactional()
  async genKernel() {
    await this.usersRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        username: KERNEL_USERNAME,
        password: '',
        activated: true,
      })
      .orIgnore()
      .execute();
  }

  @Transactional()
  async count(): Promise<number> {
    return this.usersRepository.countBy({
      username: Not(KERNEL_USERNAME),
    });
  }

  @Transactional()
  async create(input: UserInput, actor: User = null, allowedFields: UserField[] = USER_FIELDS): Promise<User> {
    const userExist = await this.usersRepository.findOne({
      where: [{ username: input.username }, ...(input.email ? [{ email: input.email }] : [])],
    });

    if (userExist) {
      throw new ConflictException();
    }

    const user = new User();

    const allowed = new Set(allowedFields);

    user.uuid = randomUUID();
    if (actor && !actor.superuser && input.superuser) throw new ForbiddenException();

    if (!allowed.has('email') && input.email) throw new ForbiddenException();
    if (!allowed.has('activated') && input.activated) throw new ForbiddenException();
    if (!allowed.has('roles') && (input.roles || []).some((id) => id != ImportantRoles.Default)) throw new ForbiddenException();
    if (!allowed.has('perms') && (input.perms || []).length) throw new ForbiddenException();

    user.username = input.username;
    user.superuser = actor && !actor.superuser ? null : input.superuser;
    user.locale = input.locale;
    user.password = await this.passwordService.hash(input.password, passwordAad(user.uuid));

    if (allowed.has('email')) user.email = input.email;
    if (allowed.has('activated')) user.activated = input.activated;
    if (allowed.has('perms')) user.perms = input.perms;

    if (!input.roles || !allowed.has('roles')) input.roles = [];

    user.roles = await this.rolesRepository.findBy({
      id: In(input.roles),
    });

    if (!user.roles.find((role) => role.id === ImportantRoles.Default))
      user.roles.push(await this.rolesRepository.findOneBy({ id: ImportantRoles.Default }));

    if (actor) {
      if (!(await userPermissionCheck(user, actor))) throw new ForbiddenException();

      if (adminPermissions(user).length && !(await canGrantAdminPermissions(actor))) throw new ForbiddenException();
    }

    return this.usersRepository.save(user);
  }

  @Transactional()
  async update(uuid: string, input: UserUpdateInput, actor: User = null, allowedFields: UserField[] = USER_FIELDS): Promise<User> {
    const user = await this.getById(uuid);

    if (!user) throw new NotFoundException();

    const allowed = new Set(allowedFields);

    const before = { ...user, perms: [...(user.perms || [])], roles: [...(user.roles || [])] } as User;

    if (actor && !(await userPermissionCheck(before, actor))) throw new ForbiddenException();

    if (actor && !actor.superuser && input.superuser !== undefined && Boolean(input.superuser) !== Boolean(user.superuser))
      throw new ForbiddenException();

    const superuser = actor && !actor.superuser ? user.superuser : input.superuser;

    if (!allowed.has('email') && input.email !== undefined && (input.email || null) != (user.email || null)) throw new ForbiddenException();

    if (!allowed.has('activated') && input.activated !== undefined && Boolean(input.activated) != Boolean(user.activated))
      throw new ForbiddenException();

    if (
      !allowed.has('roles') &&
      input.roles !== undefined &&
      !sameSet(
        input.roles,
        (user.roles || []).map((role) => role.id),
      )
    )
      throw new ForbiddenException();

    if (!allowed.has('perms') && input.perms !== undefined && !sameSet(input.perms, user.perms || [])) throw new ForbiddenException();

    user.username = input.username;
    user.superuser = superuser;

    if (allowed.has('email')) user.email = input.email;
    if (allowed.has('activated')) user.activated = input.activated;
    if (allowed.has('perms')) user.perms = input.perms;

    if (allowed.has('roles')) {
      if (!input.roles) input.roles = [];

      user.roles = await this.rolesRepository.findBy({
        id: In(input.roles),
      });

      if (!user.roles.find((role) => role.id === ImportantRoles.Default))
        user.roles.push(await this.rolesRepository.findOneBy({ id: ImportantRoles.Default }));
    }

    if (actor && !(await userPermissionCheck(user, actor))) throw new ForbiddenException();

    if (actor && _.difference(adminPermissions(user), adminPermissions(before)).length && !(await canGrantAdminPermissions(actor)))
      throw new ForbiddenException();

    if (actor && user.uuid == actor.uuid) {
      if (actor.superuser != user.superuser) throw new BadRequestException();

      if (!(await matchPermission([Permission.AdminDashboard, Permission.AdminUsersUpdate], { user }))) throw new BadRequestException();
    }

    return this.usersRepository.save(user);
  }

  @Transactional()
  async updatePassord(uuid: string, input: PasswordUpdateInput, actor: User = null) {
    const user = await this.getById(uuid);
    if (!user) throw new NotFoundException();

    if (actor) {
      if (!(await userPermissionCheck(user, actor))) throw new ForbiddenException();
    }

    return this.settingsService.updatePassword(user, input);
  }

  @Transactional()
  async delete(uuid: string, actor: User = null) {
    const user = await this.getById(uuid);

    if (!user) throw new NotFoundException();

    if (actor) {
      if (!(await userPermissionCheck(user, actor))) throw new ForbiddenException();
    }

    return this.usersRepository.remove(user);
  }

  @Transactional()
  async deleteMany(input: DeleteManyUuidInput, actor: User = null) {
    const users = await this.usersRepository.findBy({ uuid: In(input.items) });

    if (actor) {
      for (const user of users) if (!(await userPermissionCheck(user, actor))) throw new ForbiddenException();
    }

    await this.usersRepository.remove(users);
    return true;
  }
}
