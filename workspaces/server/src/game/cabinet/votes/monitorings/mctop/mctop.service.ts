import { Injectable } from "@nestjs/common";
import { MonitoringCoreService } from "../core/monitoring-core.service";
import * as crypto from 'crypto';
import { envConfig } from "unicore-common";
import { MonitoringHandlerService } from "../core/monitoring-handler.service";
import { MctopModule } from "./mctop.module";
import { MonitoringResp } from "../core/monitoring-resp.enum";

@Injectable()
export class MctopService implements MonitoringCoreService {
  constructor(private mhService: MonitoringHandlerService) { }

  async handler(input: any) {
    if (input.token != crypto.createHash('md5').update(input.nickname + envConfig.mctopSecretKey).digest('hex'))
      return MonitoringResp.WrongToken

    if (!this.mhService.handler(MctopModule.id, input.nickname))
      return MonitoringResp.WrongUsername

    return MonitoringResp.OK
  }
}