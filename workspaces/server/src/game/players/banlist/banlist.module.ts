import { Module } from '@nestjs/common';
import { BanListService } from './banlist.service';
import { BanListController } from './banlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ban } from 'src/game/cabinet/bans/entities/ban.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ban])],
  providers: [BanListService],
  controllers: [BanListController],
})
export class BanListModule {}
