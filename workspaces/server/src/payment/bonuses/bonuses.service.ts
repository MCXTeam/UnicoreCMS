import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { Repository } from 'typeorm';
import { BonusInput } from './dto/bonus.dto';
import { Bonus } from './entities/bonus.entity';

@Injectable()
export class BonusesService {
  constructor(
    @InjectRepository(Bonus)
    private bonusesRepository: Repository<Bonus>,
  ) {}

  find(): Promise<Bonus[]> {
    return this.bonusesRepository.find({
      order: {
        amount: 'ASC',
      },
    });
  }

  findOne(id: number): Promise<Bonus> {
    return this.bonusesRepository.findOne(id);
  }

  async create(input: BonusInput): Promise<Bonus> {
    const bonus = new Bonus();

    bonus.bonus = input.bonus;
    bonus.amount = input.amount;

    return this.bonusesRepository.save(bonus);
  }

  async update(id: number, input: BonusInput): Promise<Bonus> {
    const bonus = await this.findOne(id);

    if (!bonus) {
      throw new NotFoundException();
    }

    bonus.bonus = input.bonus;
    bonus.amount = input.amount;

    return this.bonusesRepository.save(bonus);
  }

  async remove(id: number): Promise<Bonus> {
    const bonus = await this.findOne(id);

    if (!bonus) {
      throw new NotFoundException();
    }

    return this.bonusesRepository.remove(bonus);
  }

  async updateIcon(id: number, file: MulterFile) {
    const bonus = await this.findOne(id);

    if (!bonus) {
      StorageManager.remove(file.filename);
      throw new NotFoundException();
    }

    StorageManager.remove(bonus.icon);
    bonus.icon = file.filename;

    return this.bonusesRepository.save(bonus);
  }

  async removeIcon(id: number) {
    const bonus = await this.findOne(id);

    if (!bonus) {
      throw new NotFoundException();
    }

    StorageManager.remove(bonus.icon);
    bonus.icon = null;

    return this.bonusesRepository.save(bonus);
  }
}
