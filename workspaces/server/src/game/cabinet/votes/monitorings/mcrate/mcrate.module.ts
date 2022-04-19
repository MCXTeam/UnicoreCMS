import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { MonitoringCoreModule } from '../core/monitoring-core.module';
import { MonitoringHandlerModule } from '../core/monitoring-handler.module';
import { McrateController } from './mcrate.controller';
import { McrateService } from './mcrate.service';

@Module({
  imports: [MonitoringHandlerModule],
  providers: [McrateService],
  controllers: [McrateController],
})
export class McrateModule implements MonitoringCoreModule {
  static id = "mcrate"
  static enabled = envConfig.mcrateEnabled;
}
