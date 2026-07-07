import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
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
import { AppController } from './app.controller';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl, hostname } = request;

    response.on('close', () => {
      const { statusCode } = response;

      this.logger.log(`${method} ${hostname + originalUrl} ${statusCode} - ${ip}`);
    });

    next();
  }
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ormconfig,
      dataSourceFactory: async (options) => {
        if (!options) throw new Error('Invalid TypeORM data source options');
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    GoogleRecaptchaModule.forRoot({
      secretKey: envConfig.recaptchaSecret || 'disabled',
      response: (req) => req.headers.recaptcha,
      actions: ['login', 'register', 'reset', 'verify', 'gift'],
      network: GoogleRecaptchaNetwork.Recaptcha,
      skipIf: !envConfig.recaptchaSecret,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 120000,
        limit: 10,
      },
    ]),
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
    CronModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule, OnModuleInit {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }

  onModuleInit() {}
}
