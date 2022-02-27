import { Module } from '@nestjs/common';
import { VotesListService } from './votes-list.service';
import { VotesListController } from './votes-list.controller';

@Module({
  providers: [VotesListService],
  controllers: [VotesListController],
})
export class VotesListModule {}
