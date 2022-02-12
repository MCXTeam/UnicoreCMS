import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PaginateQuery, Paginated, paginate, FilterOperator } from 'nestjs-paginate';

export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create() {}

  findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.skin', 'skin');

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

  async count(): Promise<number> {
    return this.usersRepository.count();
  }
}
