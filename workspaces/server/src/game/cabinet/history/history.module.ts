import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from './entities/history.entity';
import UsersModule from 'src/admin/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([History]), UsersModule],
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}
