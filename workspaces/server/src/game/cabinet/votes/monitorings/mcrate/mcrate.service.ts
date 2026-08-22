import { Injectable } from '@nestjs/common';
import { MonitoringCoreService } from '../core/monitoring-core.service';
import * as crypto from 'crypto';
import { envConfig } from 'unicore-common';
import { safeEqual } from '@common';
import { MonitoringHandlerService } from '../core/monitoring-handler.service';
import { MonitoringResp } from '../core/monitoring-resp.enum';
import { McrateModule } from './mcrate.module';
import { McrateCallbackInput } from './dto/mcrate-callback.input';

@Injectable()
export class McrateService implements MonitoringCoreService {
  constructor(private mhService: MonitoringHandlerService) {}

  async handler(input: McrateCallbackInput) {
    const hash = crypto
      .createHash('md5')
      .update(
        crypto
          .createHash('md5')
          .update(input.nick + envConfig.mcrateSecretKey + 'mcrate')
          .digest('hex'),
      )
      .digest('hex');

    if (!safeEqual(hash, input.hash)) return MonitoringResp.WrongToken;

    if (!(await this.mhService.handler(McrateModule.id, input.nick))) return MonitoringResp.WrongUsername;

    return MonitoringResp.OK;
  }
}
