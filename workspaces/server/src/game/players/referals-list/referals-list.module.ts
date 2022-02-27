import { Module } from '@nestjs/common';
import { ReferalsListService } from './referals-list.service';
import { ReferalsListController } from './referals-list.controller';

@Module({
  providers: [ReferalsListService],
  controllers: [ReferalsListController],
})
export class ReferalsListModule {}
