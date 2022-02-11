import { Module } from '@nestjs/common';
import { ModsService } from './mods.service';
import { ModsController } from './mods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mod } from './entities/mod.entity';
import { Server } from '../entities/server.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mod, Server])],
  providers: [ModsService],
  controllers: [ModsController],
})
export class ModsModule {}
