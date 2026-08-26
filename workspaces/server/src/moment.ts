import { Global, Module } from '@nestjs/common';
import Moment from 'moment-timezone';
import { extendMoment } from 'moment-range';
import { envConfig } from 'unicore-common';

const moment = extendMoment(Moment as any);

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
