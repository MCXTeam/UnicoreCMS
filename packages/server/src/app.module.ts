import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envConfig } from 'unicore-common';
import { NamingStrategy } from '@common';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { GameModule } from './game/game.module';
import { PaymentModule } from './payment/payment.module';
import { GoogleRecaptchaModule, GoogleRecaptchaNetwork } from '@nestlab/google-recaptcha';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MomentModule } from './moment';
import { EventsModule } from './events/events.module';
import { IntegrationsModule } from './admin/integrations/integrations.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: envConfig.databaseType as any,
      host: envConfig.databaseHost,
      port: envConfig.databasePort,
      username: envConfig.databaseUser,
      password: envConfig.databasePassword,
      database: envConfig.databaseName,
      entities: ['./**/*.entity.js'],
      namingStrategy: new NamingStrategy(),
      synchronize: true,
      // logging: true
    }),
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
    HttpModule,
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
