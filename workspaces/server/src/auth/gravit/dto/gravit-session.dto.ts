import { GravitUserDto } from "./gravit-user.dto";
import { nanoid } from 'nanoid';
import { JWTPayload } from "src/auth/interfaces/jwt-payload";
import { User } from "src/admin/users/entities/user.entity";
import { instanceToPlain } from "class-transformer";

export class GravitSessionDto {
  id: string
  user: GravitUserDto
  expireIn: number

  constructor(
    user: User,
    accessToken: string,
    accessTokenPayload: JWTPayload
  ) {
    this.id = nanoid()
    this.expireIn = accessTokenPayload.exp
    this.user = instanceToPlain(new GravitUserDto({ ...user, accessToken })) as GravitUserDto
  }
}