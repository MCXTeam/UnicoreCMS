import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';

@Module({
  providers: [LogsService],
  controllers: [LogsController],
  exports: [LogsService]
})
export class LogModule {}
