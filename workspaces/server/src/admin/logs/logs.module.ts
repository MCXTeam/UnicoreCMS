import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '@common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [LogsService],
  controllers: [LogsController],
  exports: [LogsService],
})
export class LogModule {}
