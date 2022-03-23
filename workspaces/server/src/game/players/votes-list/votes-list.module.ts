import { Module } from '@nestjs/common';
import { VotesListService } from './votes-list.service';
import { VotesListController } from './votes-list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vote])],
  providers: [VotesListService],
  controllers: [VotesListController],
})
export class VotesListModule {}
