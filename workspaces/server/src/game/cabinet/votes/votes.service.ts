import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { Repository } from 'typeorm';
import { VirtualCurrencyUserUpdate } from './dto/virtual-cur-user-update.input';
import { VoteGiftInput } from './dto/vote-gift.input';
import { VoteGift } from './entities/vote-gift.entity';

@Injectable()
export class VotesService {
  private monitorings: string[] = new Array()

  constructor(
    @InjectRepository(VoteGift)
    private voteGiftsRepository: Repository<VoteGift>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async getMonitorings() {
    return this.monitorings
  }

  async setMonitorings(monitorings: string[]) {
    this.monitorings = monitorings
  }

  find(): Promise<VoteGift[]> {
    return this.voteGiftsRepository.find({
      order: {
        place: 'ASC',
      },
    });
  }

  findOne(id: number): Promise<VoteGift> {
    return this.voteGiftsRepository.findOne(id);
  }

  async create(input: VoteGiftInput): Promise<VoteGift> {
    const vg = new VoteGift();

    vg.place = input.place;
    vg.bonus = input.bonus;

    return this.voteGiftsRepository.save(vg);
  }

  async update(id: number, input: VoteGiftInput): Promise<VoteGift> {
    const vg = await this.voteGiftsRepository.findOne(id);

    if (!vg) {
      throw new NotFoundException();
    }

    vg.place = input.place;
    vg.bonus = input.bonus;

    return this.voteGiftsRepository.save(vg);
  }

  async remove(id: number): Promise<VoteGift> {
    const vg = await this.voteGiftsRepository.findOne(id);

    if (!vg) {
      throw new NotFoundException();
    }

    return this.voteGiftsRepository.remove(vg);
  }

  async updateVirtual(input: VirtualCurrencyUserUpdate) {
    const user = await this.usersRepository.findOne(input.uuid)
    if (!user) throw new NotFoundException();

    user.virtual = currencyUtils.roundByType(input.amount, SystemCurrency.VIRTAUL);
    await this.usersRepository.save(user);
    return true;
  }
}
