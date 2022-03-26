import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { MonitoringCoreModule } from '../core/monitoring-core.module';
import { MonitoringHandlerModule } from '../core/monitoring-handler.module';
import { TopcraftController } from './topcraft.controller';
import { TopcraftService } from './topcraft.service';

@Module({
  imports: [MonitoringHandlerModule],
  providers: [TopcraftService],
  controllers: [TopcraftController],
})
export class TopcraftModule implements MonitoringCoreModule {
  static id = "topcraft"
  static enabled = envConfig.topcraftEnabled;
}
