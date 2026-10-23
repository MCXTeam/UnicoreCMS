import { Module } from '@nestjs/common';
import { BanListService } from './banlist.service';
import { BanListController } from './banlist.controller';
import { PunishmentsModule } from '../../punishments/punishments.module';

@Module({
  imports: [PunishmentsModule],
  providers: [BanListService],
  controllers: [BanListController],
})
export class BanListModule {}
