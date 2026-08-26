import { SafeCron } from '@common';
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class TokenTasks {
  constructor(
    @InjectRepository(RefreshToken)
    private tokensRepository: Repository<RefreshToken>,
  ) {}

  @SafeCron(CronExpression.EVERY_HOUR, 'tokens-cleanup')
  async clean() {
    const expiresTokens = await this.tokensRepository.findBy({
      expires: LessThan(moment().toDate()),
    });
    await this.tokensRepository.remove(expiresTokens);
  }
}
