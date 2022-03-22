import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UsersModule from 'src/admin/users/users.module';
import { BansController } from './bans.controller';
import { BansService } from './bans.service';
import { Ban } from './entities/ban.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ban]), UsersModule],
  providers: [BansService],
  controllers: [BansController],
})
export class BanModule {}
