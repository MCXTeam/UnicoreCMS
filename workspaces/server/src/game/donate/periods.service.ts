import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Period } from './entities/period.entity';
import { PeriodInput } from './dto/period.input';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(Period)
    private periodsRepository: Repository<Period>,
  ) {}

  find(): Promise<Period[]> {
    return this.periodsRepository.find();
  }

  findOne(id: number): Promise<Period> {
    return this.periodsRepository.findOne(id);
  }

  async create(input: PeriodInput): Promise<Period> {
    const period = new Period();

    period.name = input.name;
    period.multiplier = input.multiplier;
    period.expire = input.expire;

    return this.periodsRepository.save(period);
  }

  async update(id: number, input: PeriodInput): Promise<Period> {
    const period = await this.findOne(id);

    if (!period) {
      throw new NotFoundException();
    }

    period.name = input.name;
    period.multiplier = input.multiplier;
    period.expire = input.expire;

    return this.periodsRepository.save(period);
  }

  async remove(id: number): Promise<Period> {
    const period = await this.findOne(id);

    if (!period) {
      throw new NotFoundException();
    }

    return this.periodsRepository.remove(period);
  }
}
