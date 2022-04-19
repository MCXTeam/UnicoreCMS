import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { MonitoringCoreModule } from '../core/monitoring-core.module';
import { MonitoringHandlerModule } from '../core/monitoring-handler.module';
import { MonitoringminecraftController } from './monitoringminecraft.controller';
import { MonitoringminecraftService } from './monitoringminecraft.service';

@Module({
  imports: [MonitoringHandlerModule],
  providers: [MonitoringminecraftService],
  controllers: [MonitoringminecraftController],
})
export class MonitoringminecraftModule implements MonitoringCoreModule {
  static id = "monitoringminecraft"
  static enabled = envConfig.monitoringminecraftEnabled;
}
