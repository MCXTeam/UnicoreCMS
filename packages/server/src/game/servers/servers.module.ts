import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ModsModule } from './mods/mods.module';
import { OnlineModule } from './online/online.module';
import { ServersController } from './servers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { Mod } from './mods/entities/mod.entity';
import { Query } from './online/entities/query.entity';

@Module({
  providers: [ServersService],
  imports: [ModsModule, OnlineModule, TypeOrmModule.forFeature([Server, Mod, Query])],
  exports: [ServersService],
  controllers: [ServersController],
})
export class ServersModule {}
