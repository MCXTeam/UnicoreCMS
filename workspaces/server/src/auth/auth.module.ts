import { Module } from '@nestjs/common';
import type { StringValue } from 'ms';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import UsersModule from 'src/admin/users/users.module';
import { envConfig } from 'unicore-common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokensService } from './tokens.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiModule } from 'src/admin/api/api.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { EmailModule } from 'src/admin/email/email.module';
import { SettingsModule } from 'src/game/cabinet/settings/settings.module';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { PasswordModule } from './password/password.module';
import { ConfigModule } from 'src/admin/config/config.module';
import { ActivatedGuard } from './guards/activated.guard';

@Module({
  imports: [
    ConfigModule,
    PasswordModule,
    UsersModule,
    ApiModule,
    EmailModule,
    SettingsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([RefreshToken, User, Referal]),
    JwtModule.register({
      secret: envConfig.jwtKey,
      signOptions: { expiresIn: envConfig.jwtExpires as StringValue },
    }),
  ],
  providers: [
    AuthService,
    TokensService,
    ApiKeyStrategy,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActivatedGuard,
    },
  ],
  exports: [AuthService, TokensService],
  controllers: [AuthController],
})
export class AuthModule {}
