import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { envConfig } from 'unicore-common';

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      defaults: {
        from: envConfig.mailFrom,
      },
      transport: {
        service: envConfig.smtpService,
        host: envConfig.smtpHost,
        port: envConfig.smtpPort,
        ignoreTLS: envConfig.smtpIgnoreTLS,
        secure: envConfig.smtpSecure,
        auth: {
          user: envConfig.smtpUser,
          pass: envConfig.smtpPassword,
        },
      },
    }),
  ],
  exports: [MailerModule],
})
export class AppMailerModule {}
