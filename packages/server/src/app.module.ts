import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envConfig } from 'unicore-common';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { GameModule } from './game/game.module';
import { PaymentModule } from './payment/payment.module';
import { GoogleRecaptchaModule, GoogleRecaptchaNetwork } from '@nestlab/google-recaptcha';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MomentModule } from './moment';
import { EventsModule } from './events/events.module';
import { IntegrationsModule } from './admin/integrations/integrations.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ormconfig } from './ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRoot(ormconfig),
    GoogleRecaptchaModule.forRoot({
      secretKey: envConfig.recaptchaSecret,
      response: (req) => req.headers.recaptcha,
      // skipIf: process.env.NODE_ENV !== 'production',
      actions: ['login'],
      network: GoogleRecaptchaNetwork.Recaptcha,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    MailerModule.forRoot({
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
    MomentModule,
    IntegrationsModule,
    EventsModule,
    ScheduleModule.forRoot(),
    AuthModule,
    AdminModule,
    GameModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
