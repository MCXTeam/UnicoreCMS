import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { JWTPayload } from '../interfaces/jwt-payload';
import { UsersService } from 'src/admin/users/users.service';
import { RolesService } from 'src/admin/roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envConfig.jwtKey,
    });
  }

  async validate(payload: JWTPayload) {
    const user = await this.usersService.getById(payload.sub);

    if (!user) {
      return null;
    }

    return user;
  }
}
