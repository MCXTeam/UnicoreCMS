import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ModsModule } from './mods/mods.module';
import { OnlineModule } from './online/online.module';
import { ServersController } from './servers.controller';
import { ModsController } from './mods/mods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { Mod } from './mods/entities/mod.entity';
import { Query } from './online/entities/query.entity';
import { RconModule } from './rcon/rcon.module';

@Module({
  providers: [ServersService],
  imports: [ModsModule, OnlineModule, RconModule, TypeOrmModule.forFeature([Server, Mod, Query])],
  exports: [ServersService],
  controllers: [ModsController, ServersController],
})
export class ServersModule {}
