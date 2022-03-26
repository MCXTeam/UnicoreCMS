import { BadRequestException, Injectable } from "@nestjs/common";
import { MonitoringCoreService } from "../core/monitoring-core.service";
import { MonitoringHandlerService } from "../core/monitoring-handler.service";
import * as crypto from 'crypto';
import { MinecraftRatingModule } from "./minecraftrating.module";
import { MonitoringResp } from "../core/monitoring-resp.enum";
import { envConfig } from "unicore-common";

@Injectable()
export class MinecraftRatingService implements MonitoringCoreService {
  constructor(private mhService: MonitoringHandlerService) { }

  async handler(input: any) {
    if (input.token != crypto.createHash('sha1').update(input.username + input.timestamp + envConfig.minecraftratingSecretKey).digest('hex'))
      throw new BadRequestException(MonitoringResp.WrongToken)

    if (!this.mhService.handler(MinecraftRatingModule.id, input.nuckname))
      throw new BadRequestException(MonitoringResp.WrongUsername)

    return MonitoringResp.OK
  }
}