import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { MailerModule } from '@nestjs-modules/mailer';
import { ormconfig } from './ormconfig';
import { GravitModule } from './auth/gravit/gravit.module';

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';
import { CronModule } from './cron/cron.module';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl, hostname } = request;

    response.on('close', () => {
      const { statusCode } = response;

      this.logger.log(
        `${method} ${hostname + originalUrl} ${statusCode} - ${ip}`
      );
    });

    next();
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot(ormconfig),
    GoogleRecaptchaModule.forRoot({
      secretKey: envConfig.recaptchaSecret,
      response: (req) => req.headers.recaptcha,
      skipIf: process.env.NODE_ENV !== 'production',
      actions: ['login', 'register', 'reset', 'verify', 'promocode'],
      network: GoogleRecaptchaNetwork.Recaptcha,
    }),
    ThrottlerModule.forRoot({
      ttl: 120,
      limit: 10,
    }),
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
    MomentModule,
    ScheduleModule.forRoot(),
    AuthModule,
    GravitModule,
    AdminModule,
    EventsModule,
    GameModule,
    PaymentModule,
    CronModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
