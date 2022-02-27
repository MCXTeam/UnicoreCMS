import { Module } from '@nestjs/common';
import { GravitService } from './gravit.service';
import { GravitController } from './gravit.controller';

@Module({
  providers: [GravitService],
  controllers: [GravitController],
})
export class GravitModule {}
