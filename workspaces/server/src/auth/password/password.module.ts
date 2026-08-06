import { Global, Module } from '@nestjs/common';
import { PasswordService } from './password.service';

@Global()
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
