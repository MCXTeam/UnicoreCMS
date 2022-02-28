import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/admin/users/users.service';
import { TokensService } from '../tokens.service';
import { GravitUserDto } from './dto/gravit-user.dto';
import { GravitError } from './enums/gravit-error.enum';
import { TokenExpiredError } from 'jsonwebtoken';
import { GravitSessionDto } from './dto/gravit-session.dto';
import { GravitAuthorize } from './dto/inputs/gravit-authorize.input';

@Injectable()
export class GravitService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) { }

  async getUserByUsername(username_or_email: string) {
    const user = await this.usersService.getByUsernameOrEmail(username_or_email)

    if (!user)
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitUserDto(user)
  }

  async getUserByLogin(username: string) {
    const user = await this.usersService.getByUsername(username)

    if (!user)
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitUserDto(user)
  }

  async getUserByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid)

    if (!user)
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitUserDto(user)
  }

  async getUserByToken(accessToken: string) {
    try {
      var accessTokenPayload = await this.jwt.verifyAsync(accessToken);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new HttpException({ error: GravitError.ExpireToken }, HttpStatus.FORBIDDEN);
      } else {
        throw new HttpException({ error: GravitError.InvalidToken }, HttpStatus.FORBIDDEN);
      }
    }

    const user = await this.usersService.getById(accessTokenPayload.sub)

    if (!user)
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitSessionDto(user, accessToken, accessTokenPayload)
  }

  async authorize(input: GravitAuthorize) {
    const user = await this.usersService.getByUsernameOrEmail(input.login);

    if (!user)
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    
  }
}
