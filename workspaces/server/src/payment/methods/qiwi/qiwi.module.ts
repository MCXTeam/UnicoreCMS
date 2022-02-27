import { Module } from '@nestjs/common';
import { QiwiService } from './qiwi.service';
import { QiwiController } from './qiwi.controller';

@Module({
  providers: [QiwiService],
  controllers: [QiwiController],
})
export class QiwiModule {}
