import { Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { MonitoringCoreModule } from '../core/monitoring-core.module';
import { MonitoringHandlerModule } from '../core/monitoring-handler.module';
import { MinecraftRatingController } from './minecraftrating.controller';
import { MinecraftRatingService } from './minecraftrating.service';

@Module({
  imports: [MonitoringHandlerModule],
  providers: [MinecraftRatingService],
  controllers: [MinecraftRatingController],
})
export class MinecraftRatingModule implements MonitoringCoreModule {
  static id = "minecraftrating"
  static enabled = envConfig.minecraftratingEnabled;
}
