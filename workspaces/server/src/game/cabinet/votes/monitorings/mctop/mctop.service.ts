import { Injectable } from '@nestjs/common';
import { MonitoringCoreService } from '../core/monitoring-core.service';
import * as crypto from 'crypto';
import { envConfig } from 'unicore-common';
import { safeEqual } from '@common';
import { MonitoringHandlerService } from '../core/monitoring-handler.service';
import { MctopModule } from './mctop.module';
import { MonitoringResp } from '../core/monitoring-resp.enum';
import { MctopCallbackInput } from './dto/mctop-callback.input';

@Injectable()
export class MctopService implements MonitoringCoreService {
  constructor(private mhService: MonitoringHandlerService) {}

  async handler(input: MctopCallbackInput) {
    const token = crypto
      .createHash('md5')
      .update(input.nickname + envConfig.mctopSecretKey)
      .digest('hex');

    if (!safeEqual(token, input.token)) return MonitoringResp.WrongToken;

    if (!(await this.mhService.handler(MctopModule.id, input.nickname))) return MonitoringResp.WrongUsername;

    return MonitoringResp.OK;
  }
}
