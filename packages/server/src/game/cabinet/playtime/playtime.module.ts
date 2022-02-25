import { Module } from '@nestjs/common';
import { PlaytimeService } from './playtime.service';
import { PlaytimeController } from './playtime.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playtime } from './entities/playtime.entity';
import { ServersModule } from 'src/game/servers/servers.module';
import UsersModule from 'src/admin/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Playtime]), ServersModule, UsersModule],
  providers: [PlaytimeService],
  controllers: [PlaytimeController],
})
export class PlaytimeModule {}
