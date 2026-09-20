import { Paginated, PaginateQuery, paginate } from '@common';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { ReferalsService } from 'src/game/cabinet/referals/referals.service';
import { Like, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ReferalInput, ReferalInviterInput } from './dto/referal.input';

const LOOKUP_LIMIT = 10;

@Injectable()
export class AdminReferalsService {
  constructor(
    @InjectRepository(Referal) private referalsRepo: Repository<Referal>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private referalsService: ReferalsService,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<Referal>> {
    const queryBuilder = this.referalsRepo
      .createQueryBuilder('referal')
      .leftJoinAndSelect('referal.user', 'user')
      .leftJoinAndSelect('referal.inviter', 'inviter');

    return paginate(query, queryBuilder, {
      sortableColumns: ['userUuid', 'user.username', 'inviter.username', 'rewarded'],
      searchableColumns: ['user.username', 'inviter.username'],
      defaultSortBy: [['user.username', 'ASC']],
    });
  }

  async lookup(search: string): Promise<User[]> {
    const term = (search || '').trim();

    if (!term) return [];

    return this.usersRepo.find({ where: { username: Like(`%${term}%`) }, take: LOOKUP_LIMIT, order: { username: 'ASC' } });
  }

  async findOne(uuid: string): Promise<Referal> {
    const referal = await this.referalsRepo.findOne({ where: { userUuid: uuid }, relations: ['user', 'inviter'] });

    if (!referal) throw new NotFoundException();

    return referal;
  }

  private async resolve(userUuid: string, inviterUuid: string): Promise<{ user: User; inviter: User }> {
    if (userUuid === inviterUuid) throw new BadRequestException('Игрок не может быть пригласившим самого себя');

    const [user, inviter] = await Promise.all([this.usersRepo.findOneBy({ uuid: userUuid }), this.usersRepo.findOneBy({ uuid: inviterUuid })]);

    if (!user || !inviter) throw new NotFoundException('Игрок не найден');

    if (await this.referalsService.wouldCycle(inviter.uuid, user.uuid))
      throw new BadRequestException('Пригласивший сам приглашён этим игроком');

    return { user, inviter };
  }

  async create(input: ReferalInput): Promise<Referal> {
    if (await this.referalsRepo.findOneBy({ userUuid: input.user_uuid }))
      throw new ConflictException('У этого игрока уже есть пригласивший');

    const { user, inviter } = await this.resolve(input.user_uuid, input.inviter_uuid);
    const referal = new Referal();

    referal.user = user;
    referal.inviter = inviter;

    await this.referalsRepo.save(referal);

    return this.findOne(user.uuid);
  }

  async update(uuid: string, input: ReferalInviterInput): Promise<Referal> {
    const referal = await this.findOne(uuid);
    const { inviter } = await this.resolve(referal.userUuid, input.inviter_uuid);

    referal.inviter = inviter;

    await this.referalsRepo.save(referal);

    return this.findOne(uuid);
  }

  async remove(uuid: string): Promise<Referal> {
    const referal = await this.findOne(uuid);

    await this.referalsRepo.delete({ userUuid: uuid });

    return referal;
  }
}
