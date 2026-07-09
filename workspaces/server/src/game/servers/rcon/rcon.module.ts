import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/admin/config/config.module';
import { RCON } from './entities/rcon.entity';
import { RconCommand } from './entities/rcon-command.entity';
import { IssuanceService } from './issuance.service';
import { RconController } from './rcon.controller';
import { RconService } from './rcon.service';
import { RconQueueService } from './rcon-queue.service';
import { TemplateService } from './template.service';

@Module({
  imports: [TypeOrmModule.forFeature([RCON, RconCommand]), ConfigModule],
  controllers: [RconController],
  providers: [RconService, RconQueueService, TemplateService, IssuanceService],
  exports: [RconService, RconQueueService, TemplateService, IssuanceService],
})
export class RconModule {}
