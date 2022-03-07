import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/admin/users/users.service';
import { TokensService } from '../tokens.service';
import { GravitUserDto } from './dto/gravit-user.dto';
import { GravitAuthReportDto } from './dto/gravit-auth-report.dto';
import { GravitError } from './enums/gravit-error.enum';
import { TokenExpiredError } from 'jsonwebtoken';
import { GravitSessionDto } from './dto/gravit-session.dto';
import { GravitAuthorize } from './dto/inputs/gravit-authorize.input';
import { AuthService } from '../auth.service';
import { TwoFactorService } from 'src/game/cabinet/settings/providers/two_factor.service';
import { JWTMinecraftPayload, JWTRefreshPayload } from '../interfaces/jwt-payload';
import { GravitRefreshToken } from './dto/inputs/gravit-refresh-token.input';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Repository } from 'typeorm';
import { GravitJoinServer } from './dto/inputs/gravit-join-server.input';
import { GravitCheckServer } from './dto/inputs/gravit-check-server.input';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class GravitService {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private tokensService: TokensService,
    private twoFactorService: TwoFactorService,
    private jwt: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private tokensRepository: Repository<RefreshToken>,
  ) { }

  async getUserByUsername(username_or_email: string) {
    const user = await this.usersService.getByUsernameOrEmail(username_or_email)

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
        throw new HttpException({ error: GravitError.ExpireToken }, HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException({ error: GravitError.InvalidToken }, HttpStatus.UNAUTHORIZED);
      }
    }

    const user = await this.usersService.getById(accessTokenPayload.sub)

    if (!user)
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitSessionDto(user)
  }

  async authorize(input: GravitAuthorize) {
    let password: string = null
    let totp: string = null

    if ('password' in input.password) {
      password = input.password?.password
    } else {
      password = input.password?.firstPassword?.password
      totp = input.password?.secondPassword?.totp
    }

    const user = await this.usersService.getByUsernameOrEmail(input.login);
    if (!user)
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    if (!password)
      throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);

    const valid = await this.authService.validateCredentials(user, password);
    if (!valid)
      throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);

    if (user.two_factor_enabled && input?.context) {
      if (!totp)
        throw new HttpException({ error: GravitError.Require2FA }, HttpStatus.UNAUTHORIZED);

      if (!this.twoFactorService.verify(user, totp))
        throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);
    }

    // if (user.ban)
    //   throw new HttpException({ error: GravitError.UserBlocked }, HttpStatus.FORBIDDEN);

    const refreshToken = await this.tokensService.generateRefreshToken(user, "launcher", input?.context?.ip);
    const refreshTokenPayload = await this.tokensService.decodeToken(refreshToken) as JWTRefreshPayload;

    const accessToken = await this.tokensService.generateAccessToken(user);

    user.accessToken = await this.tokensService.generateMinecraftAccessToken(user, refreshTokenPayload)
    await this.usersRepository.save(user)

    return new GravitAuthReportDto(user, accessToken, refreshToken)
  }

  async refreshAccessToken(input: GravitRefreshToken) {
    try {
      const { user } = await this.tokensService.resolveRefreshToken(input.refreshToken);
      // const refreshTokenPayload = await this.tokensService.decodeToken(input.refreshToken) as JWTRefreshPayload;
      const { accessToken } = await this.tokensService.createTokensFromRefreshToken(input.refreshToken, "launcher", input?.context?.ip)

      // user.accessToken = await this.tokensService.generateMinecraftAccessToken(user, refreshTokenPayload)
      // await this.usersRepository.save(user)

      return new GravitAuthReportDto(user, accessToken, input.refreshToken)
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new HttpException({ error: GravitError.ExpireToken }, HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException({ error: GravitError.InvalidToken }, HttpStatus.UNAUTHORIZED);
      }
    }
  }

  async deleteSession(input: any) {
    const user = await this.usersRepository.findOne({
      username: input.user?.username
    })

    if (user) {
      const tokens = await this.tokensRepository.find({ user, agent: "launcher" })
      await this.tokensRepository.remove(tokens)
    }
  }

  async exitUser(input: any) {
    const user = await this.usersRepository.findOne({
      username: input.username
    })

    if (user) {
      const tokens = await this.tokensRepository.find({ user, agent: "launcher" })
      await this.tokensRepository.remove(tokens)
    }
  }

  async joinServer(input: GravitJoinServer) {
    try {
      var minecraftTokenPayload = await this.tokensService.decodeToken(input.accessToken) as JWTMinecraftPayload;
    } catch (e) {
      throw new ForbiddenException();
    }

    const token = await this.tokensRepository.findOne({
      uuid: minecraftTokenPayload.ref,
    }, { relations: ['user'] })

    if (!token?.user || token?.user.accessToken != input.accessToken)
      throw new ForbiddenException();

    token.user.serverId = input.serverId
    await this.usersRepository.save(token?.user)
  }

  async checkServer(input: GravitCheckServer) {
    const user = await this.usersRepository.findOne({
      username: input.username,
      serverId: input.serverId
    })

    if (!user)
      throw new ForbiddenException();

    return new GravitUserDto(user)
  }
}
