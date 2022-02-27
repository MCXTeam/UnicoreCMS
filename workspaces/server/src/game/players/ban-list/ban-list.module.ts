import { Module } from '@nestjs/common';
import { BanListService } from './ban-list.service';
import { BanListController } from './ban-list.controller';

@Module({
  providers: [BanListService],
  controllers: [BanListController],
})
export class BanListModule {}
