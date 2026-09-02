import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'src/admin/config/config.module';
import { PasswordPolicyService } from './password-policy.service';
import { PasswordService } from './password.service';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [PasswordService, PasswordPolicyService],
  exports: [PasswordService, PasswordPolicyService],
})
export class PasswordModule {}
