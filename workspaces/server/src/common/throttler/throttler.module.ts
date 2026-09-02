import { Global, Module } from '@nestjs/common';
import { ThrottlerService } from './throttler.service';

@Global()
@Module({
  providers: [ThrottlerService],
  exports: [ThrottlerService],
})
export class ThrottlerModule {}
