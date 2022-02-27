import { MomentWrapper } from '@common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class OnlineTasks {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(RefreshToken)
    private tokensRepository: Repository<RefreshToken>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async clean() {
    const expiresTokens = await this.tokensRepository.find({
      expires: LessThan(this.moment().toDate()),
    });
    await this.tokensRepository.remove(expiresTokens);
  }
}
