import { Module } from '@nestjs/common';
import { FreekassaService } from './freekassa.service';
import { FreekassaController } from './freekassa.controller';

@Module({
  providers: [FreekassaService],
  controllers: [FreekassaController],
})
export class FreekassaModule {}
