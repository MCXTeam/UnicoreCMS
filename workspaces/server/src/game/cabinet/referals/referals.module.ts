import { Module } from '@nestjs/common';
import { ReferalsService } from './referals.service';
import { ReferalsController } from './referals.controller';

@Module({
  providers: [ReferalsService],
  controllers: [ReferalsController],
})
export class ReferalsModule {}
