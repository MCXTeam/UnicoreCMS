import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { MonitoringCoreModule } from '../core/monitoring-core.module';
import { MonitoringHandlerModule } from '../core/monitoring-handler.module';
import { MctopController } from './mctop.controller';
import { MctopService } from './mctop.service';

@Module({
  imports: [MonitoringHandlerModule],
  providers: [MctopService],
  controllers: [MctopController],
})
export class MctopModule implements MonitoringCoreModule {
  static id = "mctop"
  static enabled = envConfig.mctopEnabled;
}
