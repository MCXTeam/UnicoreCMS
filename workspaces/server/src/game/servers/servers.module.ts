import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ModsModule } from './mods/mods.module';
import { OnlineModule } from './online/online.module';
import { ServersController } from './servers.controller';
import { ModsController } from './mods/mods.controller';
import { OnlineController } from './online/online.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { Mod } from './mods/entities/mod.entity';
import { Query } from './online/entities/query.entity';
import { ServerInstance } from './entities/server-instance.entity';
import { RconModule } from './rcon/rcon.module';

@Module({
  providers: [ServersService],
  imports: [ModsModule, OnlineModule, RconModule, TypeOrmModule.forFeature([Server, Mod, Query, ServerInstance])],
  exports: [ServersService],
  controllers: [ModsController, OnlineController, ServersController],
})
export class ServersModule {}
