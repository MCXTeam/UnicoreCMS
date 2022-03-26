import { Injectable } from "@nestjs/common";
import { MonitoringCoreService } from "../core/monitoring-core.service";
import { MonitoringHandlerService } from "../core/monitoring-handler.service";
import * as crypto from 'crypto';
import { MonitoringResp } from "../core/monitoring-resp.enum";
import { envConfig } from "unicore-common";
import { TopcraftModule } from "./topcraft.module";

@Injectable()
export class TopcraftService implements MonitoringCoreService {
  constructor(private mhService: MonitoringHandlerService) { }

  async handler(input: any) {
    if (input.token != crypto.createHash('sha1').update(input.username + input.timestamp + envConfig.topcraftSecretKey).digest('hex'))
      return MonitoringResp.WrongToken

    if (!this.mhService.handler(TopcraftModule.id, input.nuckname))
      return MonitoringResp.WrongUsername

    return MonitoringResp.OK
  }
}