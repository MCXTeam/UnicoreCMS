import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/admin/config/config.module';
import { User } from 'src/admin/users/entities/user.entity';
import UsersModule from 'src/admin/users/users.module';
import { BansController } from './bans.controller';
import { BansService } from './bans.service';
import { Ban } from './entities/ban.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ban, User]), UsersModule, ConfigModule],
  providers: [BansService],
  controllers: [BansController],
})
export class BanModule {}
