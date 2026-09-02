import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { envConfig } from 'unicore-common';
import { enforceSessionTimezone } from './common/database';
import { AuthModule } from './auth/auth.module';
import { LoginAttemptsModule } from './auth/attempts/login-attempts.module';
import { AdminModule } from './admin/admin.module';
import { GameModule } from './game/game.module';
import { PaymentModule } from './payment/payment.module';
import { RecaptchaModule } from './auth/recaptcha/recaptcha.module';
import { ThrottlerModule } from './common/throttler/throttler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MomentModule } from './moment';
import { EventsModule } from './events/events.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ormconfig } from './ormconfig';
import { GravitModule } from './auth/gravit/gravit.module';
import { GmlModule } from './auth/gml/gml.module';
import { LaminaraModule } from './auth/laminara/laminara.module';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CronModule } from './cron/cron.module';
import { AppController } from './app.controller';
import { ApiHostModule } from './modules/api-host.module';
import { ModulesModule } from './modules/modules.module';
import { ThemesModule } from './modules/themes.module';
import { moduleNestImports } from './modules/runtime';

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
        const dataSource = addTransactionalDataSource(new DataSource(options));
        await dataSource.initialize();
        return enforceSessionTimezone(dataSource);
      },
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    LoginAttemptsModule,
    RecaptchaModule,
    ThrottlerModule,
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
    GmlModule,
    LaminaraModule,
    AdminModule,
    EventsModule,
    GameModule,
    PaymentModule,
    CronModule,
    ApiHostModule,
    ModulesModule,
    ThemesModule,
    ...moduleNestImports(),
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule, OnModuleInit {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }

  onModuleInit() {}
}
