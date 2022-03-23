import { Module } from '@nestjs/common';
import { PlaytimeListService } from './playtime.service';
import { PlaytimeListController } from './playtime.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playtime } from 'src/game/cabinet/playtime/entities/playtime.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Playtime])],
  providers: [PlaytimeListService],
  controllers: [PlaytimeListController],
})
export class PlaytimeListModule {}
