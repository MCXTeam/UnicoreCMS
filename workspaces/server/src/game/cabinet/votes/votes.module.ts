import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
  providers: [VotesService],
  controllers: [VotesController],
})
export class VotesModule {}
