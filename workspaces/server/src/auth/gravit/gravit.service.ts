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
import { JWTMinecraftPayload, JWTPayload, JWTRefreshPayload } from '../interfaces/jwt-payload';
import { GravitRefreshToken } from './dto/inputs/gravit-refresh-token.input';
import { GravitDeleteSession, GravitExitUser } from './dto/inputs/gravit-session.input';
import { isBanActive, safeEqual } from '@common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Repository } from 'typeorm';
import { GravitJoinServer } from './dto/inputs/gravit-join-server.input';
import { GravitCheckServer } from './dto/inputs/gravit-check-server.input';
import { RefreshToken } from '../entities/refresh-token.entity';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';

@Injectable()
export class GravitService {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private tokensService: TokensService,
    private twoFactorService: TwoFactorService,
    private configService: ConfigService,
    private jwt: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private tokensRepository: Repository<RefreshToken>,
  ) {}

  async getUserByUsername(username_or_email: string) {
    const user = await this.usersService.getByUsernameOrEmail(username_or_email);

    if (!user) throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitUserDto(user);
  }

  async getUserByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid);

    if (!user) throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitUserDto(user);
  }

  async getUserByToken(accessToken: string) {
    try {
      var accessTokenPayload: JWTPayload = await this.jwt.verifyAsync(accessToken);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new HttpException({ error: GravitError.ExpireToken }, HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException({ error: GravitError.InvalidToken }, HttpStatus.UNAUTHORIZED);
      }
    }

    if (accessTokenPayload.type && accessTokenPayload.type != 'access')
      throw new HttpException({ error: GravitError.InvalidToken }, HttpStatus.UNAUTHORIZED);

    const user = await this.usersService.getById(accessTokenPayload.sub);

    if (!user) throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    return new GravitSessionDto(user);
  }

  private async activated(user: User): Promise<boolean> {
    if (user.activated || user.superuser) return true;

    const cfg = await this.configService.load();

    return !cfg[ConfigField.EmailActivationRequired];
  }

  private assertPlayable(user: User) {
    if (isBanActive(user.ban)) throw new HttpException({ error: GravitError.UserBlocked }, HttpStatus.FORBIDDEN);
  }

  private async assertAllowed(user: User) {
    if (!(await this.activated(user))) throw new HttpException({ error: GravitError.UserNotActivated }, HttpStatus.FORBIDDEN);

    this.assertPlayable(user);
  }

  async authorize(input: GravitAuthorize) {
    let password: string = null;
    let totp: string = null;

    if ('password' in input.password) {
      password = input.password?.password;
    } else {
      password = input.password?.firstPassword?.password;
      totp = input.password?.secondPassword?.totp;
    }

    const user = await this.usersService.getByUsernameOrEmail(input.login);
    if (!user) throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);

    if (!password) throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);

    const valid = await this.authService.validateCredentials(user, password);
    if (!valid) throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);

    if (user.two_factor_enabled) {
      if (!totp) throw new HttpException({ error: GravitError.Require2FA }, HttpStatus.UNAUTHORIZED);

      if (!(await this.twoFactorService.verify(user, totp)))
        throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);
    }

    await this.assertAllowed(user);

    const refreshToken = await this.tokensService.generateRefreshToken(user, 'launcher', input?.context?.ip);
    const refreshTokenPayload = (await this.tokensService.decodeToken(refreshToken)) as JWTRefreshPayload;

    const accessToken = await this.tokensService.generateAccessToken(user);

    user.accessToken = await this.tokensService.generateMinecraftAccessToken(user, refreshTokenPayload);
    await this.usersRepository.update({ uuid: user.uuid }, { accessToken: user.accessToken });

    return new GravitAuthReportDto(user, accessToken, refreshToken);
  }

  async refreshAccessToken(input: GravitRefreshToken) {
    try {
      const { user } = await this.tokensService.resolveRefreshToken(input.refreshToken);
      // const refreshTokenPayload = await this.tokensService.decodeToken(input.refreshToken) as JWTRefreshPayload;
      const { accessToken } = await this.tokensService.createTokensFromRefreshToken(input.refreshToken, {
        agent: 'launcher',
        ip: input?.context?.ip,
        rotate: false,
      });

      // user.accessToken = await this.tokensService.generateMinecraftAccessToken(user, refreshTokenPayload)
      // await this.usersRepository.save(user)

      return new GravitAuthReportDto(user, accessToken, input.refreshToken);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new HttpException({ error: GravitError.ExpireToken }, HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException({ error: GravitError.InvalidToken }, HttpStatus.UNAUTHORIZED);
      }
    }
  }

  private async dropLauncherSessions(username: string) {
    if (!username) return;

    const user = await this.usersRepository.findOneBy({ username });

    if (!user) return;

    const tokens = await this.tokensRepository.findBy({ user: { uuid: user.uuid }, agent: 'launcher' });
    await this.tokensRepository.remove(tokens);
  }

  async deleteSession(input: GravitDeleteSession) {
    await this.dropLauncherSessions(input.user?.username);
  }

  async exitUser(input: GravitExitUser) {
    await this.dropLauncherSessions(input.username);
  }

  async joinServer(input: GravitJoinServer) {
    try {
      var minecraftTokenPayload = (await this.tokensService.decodeToken(input.accessToken)) as JWTMinecraftPayload;
    } catch (e) {
      throw new ForbiddenException();
    }

    if (minecraftTokenPayload.type && minecraftTokenPayload.type != 'minecraft') throw new ForbiddenException();

    const token = await this.tokensRepository.findOne({
      where: {
        uuid: minecraftTokenPayload.ref,
      },
      relations: ['user', 'user.ban'],
    });

    if (!token?.user || !safeEqual(token.user.accessToken, input.accessToken)) throw new ForbiddenException();

    await this.assertAllowed(token.user);

    await this.usersRepository.update({ uuid: token.user.uuid }, { serverId: input.serverId });
  }

  async checkServer(input: GravitCheckServer) {
    const user = await this.usersRepository.findOne({
      where: {
        username: input.username,
        serverId: input.serverId,
      },
      relations: ['ban'],
    });

    if (!user) throw new ForbiddenException();

    await this.assertAllowed(user);

    return new GravitUserDto(user);
  }
}
