import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PaginateQuery, Paginated, paginate, FilterOperator } from 'nestjs-paginate';
import { UserInput } from './dto/user.input';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/entities/role.entity';
import { ConflictException } from '@nestjs/common';

export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) { }

  findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.skin', 'skin')
      .where({
        username: Not('Kernel'),
      });

    return paginate(query, queryBuilder, {
      sortableColumns: ['uuid', 'username', 'email', 'created'],
      searchableColumns: ['uuid', 'username', 'email', 'created'],
      defaultSortBy: [['created', 'DESC']],
      filterableColumns: {
        created: [FilterOperator.GTE, FilterOperator.LTE],
      },
    });
  }

  async getById(uuid: string, relations?: string[]): Promise<User> {
    return this.usersRepository.findOne({ uuid }, { relations });
  }

  async getByUsername(username: string, relations?: string[]): Promise<User> {
    return this.usersRepository.findOne({ username }, { relations });
  }

  async getByEmail(email: string, relations?: string[]): Promise<User> {
    return this.usersRepository.findOne({ email }, { relations });
  }

  async getByUsernameOrEmail(username_or_email: string, relations?: string[]): Promise<User> {
    return this.usersRepository.findOne({
      where: [{ username: username_or_email }, { email: username_or_email }],
      relations,
    });
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
      where: [
        { email: input.username },
        { username: input.username }
      ]
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

    return this.usersRepository.save(user);
  }
}
