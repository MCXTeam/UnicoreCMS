import { instanceToPlain } from "class-transformer";
import { User } from "src/admin/users/entities/user.entity";
import { JWTPayload, JWTRefreshPayload } from "src/auth/interfaces/jwt-payload";
import { GravitSessionDto } from "./gravit-session.dto";

export class GravitAuthReportDto {
  minecraftAccessToken: string
  oauthAccessToken: string
  oauthRefreshToken: string
  oauthExpire: number
  session: GravitSessionDto

  constructor(
    user: User,
    accessToken: string,
    refreshToken: string,
    accessTokenPayload: JWTPayload,
    refreshTokenPayload: JWTRefreshPayload,
  ) {
    this.minecraftAccessToken = accessToken
    this.oauthAccessToken = accessToken
    this.oauthRefreshToken = refreshToken
    this.oauthExpire = refreshTokenPayload.exp
    this.session = instanceToPlain(new GravitSessionDto(user, accessToken, accessTokenPayload)) as GravitSessionDto
  }
}