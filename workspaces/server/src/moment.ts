import { Global, Module } from '@nestjs/common';
import * as Moment from 'moment-timezone';
import { extendMoment } from 'moment-range';
import { envConfig } from 'unicore-common';

const moment = extendMoment(Moment);

moment.tz.setDefault(envConfig.timezone);

@Global()
@Module({
  providers: [
    {
      provide: 'moment',
      useValue: moment,
    },
  ],
  exports: ['moment'],
})
export class MomentModule {}
