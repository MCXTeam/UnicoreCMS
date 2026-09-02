import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecaptchaService } from './recaptcha.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [RecaptchaService],
  exports: [RecaptchaService],
})
export class RecaptchaModule {}
