import { Global, Module, Scope } from '@nestjs/common';
import * as Moment from 'moment-timezone';
import { extendMoment } from 'moment-range';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
const moment = extendMoment(Moment);

@Global()
@Module({
  providers: [
    {
      provide: 'moment',
      useFactory: (request: Request) => {
        try {
          if (request.headers['timezone']) moment.tz.setDefault(request.headers['timezone'] as string);

          return moment;
        } catch {
          return moment;
        }
      },
      inject: [REQUEST],
      scope: Scope.REQUEST,
    },
  ],
  exports: ['moment'],
})
export class MomentModule {}
