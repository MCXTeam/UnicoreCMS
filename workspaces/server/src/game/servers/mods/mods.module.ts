import { Module } from '@nestjs/common';
import { ModsService } from './mods.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mod } from './entities/mod.entity';
import { Server } from '../entities/server.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mod, Server])],
  providers: [ModsService],
  exports: [ModsService],
})
export class ModsModule {}
