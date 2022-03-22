import { instanceToPlain } from 'class-transformer';
import { User } from 'src/admin/users/entities/user.entity';
import { envConfig } from 'unicore-common';
import { GravitSessionDto } from './gravit-session.dto';
import * as ms from 'ms';

export class GravitAuthReportDto {
  minecraftAccessToken: string;
  oauthAccessToken: string;
  oauthRefreshToken: string;
  oauthExpire: number;
  session: GravitSessionDto;

  constructor(user: User, accessToken: string, refreshToken: string) {
    this.minecraftAccessToken = user.accessToken;
    this.oauthAccessToken = accessToken;
    this.oauthRefreshToken = refreshToken;
    this.oauthExpire = Math.round(ms(envConfig.jwtExpires) / 1000);
    this.session = instanceToPlain(new GravitSessionDto(user)) as GravitSessionDto;
  }
}
