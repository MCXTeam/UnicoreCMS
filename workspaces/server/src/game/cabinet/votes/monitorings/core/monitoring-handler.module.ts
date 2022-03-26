import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "src/admin/config/config.module";
import { User } from "src/admin/users/entities/user.entity";
import { Vote } from "../../entities/vote.entity";
import { MonitoringHandlerService } from "./monitoring-handler.service";

@Module({
  imports: [TypeOrmModule.forFeature([Vote, User]), ConfigModule],
  providers: [MonitoringHandlerService],
  exports: [MonitoringHandlerService]
})
export class MonitoringHandlerModule {}