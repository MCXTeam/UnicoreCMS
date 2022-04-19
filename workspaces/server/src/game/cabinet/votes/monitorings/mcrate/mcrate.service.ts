import { Injectable } from "@nestjs/common";
import { MonitoringCoreService } from "../core/monitoring-core.service";
import * as crypto from 'crypto';
import { envConfig } from "unicore-common";
import { MonitoringHandlerService } from "../core/monitoring-handler.service";
import { MonitoringResp } from "../core/monitoring-resp.enum";
import { McrateModule } from "./mcrate.module";

@Injectable()
export class McrateService implements MonitoringCoreService {
  constructor(private mhService: MonitoringHandlerService) { }

  async handler(input: any) {
    if (input.hash != crypto.createHash('md5').update(crypto.createHash('md5').update(input.nick + envConfig.mcrateSecretKey + 'mcrate').digest('hex')).digest('hex'))
      return MonitoringResp.WrongToken

    if (!this.mhService.handler(McrateModule.id, input.nickname))
      return MonitoringResp.WrongUsername

    return MonitoringResp.OK
  }
}