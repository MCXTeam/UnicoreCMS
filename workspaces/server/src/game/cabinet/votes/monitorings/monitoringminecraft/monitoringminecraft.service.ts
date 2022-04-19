import { Injectable } from "@nestjs/common";
import { MonitoringCoreService } from "../core/monitoring-core.service";
import * as crypto from 'crypto';
import { envConfig } from "unicore-common";
import { MonitoringHandlerService } from "../core/monitoring-handler.service";
import { MonitoringResp } from "../core/monitoring-resp.enum";
import { MonitoringminecraftModule } from "./monitoringminecraft.module";

@Injectable()
export class MonitoringminecraftService implements MonitoringCoreService {
  constructor(private mhService: MonitoringHandlerService) { }

  async handler(input: any) {
    if (input.token != crypto.createHash('sha1').update(input.username + input.timestamp + envConfig.monitoringminecraftSecretKey).digest('hex'))
      return MonitoringResp.WrongToken

    if (!this.mhService.handler(MonitoringminecraftModule.id, input.nickname))
      return MonitoringResp.WrongUsername

    return MonitoringResp.OK
  }
}