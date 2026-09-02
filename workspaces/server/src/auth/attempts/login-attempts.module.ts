import { Global, Module } from '@nestjs/common';
import { LoginAttemptsService } from './login-attempts.service';

@Global()
@Module({
  providers: [LoginAttemptsService],
  exports: [LoginAttemptsService],
})
export class LoginAttemptsModule {}
