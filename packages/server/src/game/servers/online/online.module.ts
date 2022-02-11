import { Module } from '@nestjs/common';
import { OnlineService } from './online.service';
import { OnlineController } from './online.controller';;
import { TypeOrmModule } from '@nestjs/typeorm';
import { Online } from './entities/online.entity';
import { OnlineTasks } from './online.tasks';
import { ServersService } from '../servers.service';
import { Server } from '../entities/server.entity';
import { OnlinesRecord } from './entities/onlines-record.entity';
import { OnlinesAbsoluteRecord } from './entities/onlines-absolute-record.entity';
import { Query } from './entities/query.entity';
import { Mod } from '../mods/entities/mod.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Online, Server, OnlinesRecord, OnlinesAbsoluteRecord, Query, Mod])],
  providers: [OnlineService, OnlineTasks, ServersService],
  controllers: [OnlineController],
  exports: [OnlineService]
})
export class OnlineModule {}
