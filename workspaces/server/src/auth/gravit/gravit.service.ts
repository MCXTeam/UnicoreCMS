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
import { LoginAttemptsService } from '../attempts/login-attempts.service';
import { TwoFactorService } from 'src/game/cabinet/settings/providers/two_factor.service';
import { JWTMinecraftPayload, JWTPayload, JWTRefreshPayload } from '../interfaces/jwt-payload';
import { GravitRefreshToken } from './dto/inputs/gravit-refresh-token.input';
import { GravitDeleteSession, GravitExitUser } from './dto/inputs/gravit-session.input';
import { AuditService, isBanActive, normalizeIp, safeEqual } from '@common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Repository } from 'typeorm';
import { GravitJoinServer } from './dto/inputs/gravit-join-server.input';
import { GravitCheckServer } from './dto/inputs/gravit-check-server.input';
import { RefreshToken } from '../entities/refresh-token.entity';
import { HardwareService } from '../hardware/hardware.service';
import { GravitHardwareJoinInput } from './dto/inputs/gravit-hardware-join.input';

@Injectable()
export class GravitService {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private tokensService: TokensService,
    private twoFactorService: TwoFactorService,
    private loginAttemptsService: LoginAttemptsService,
    private auditService: AuditService,
    private jwt: JwtService,
    private hardware: HardwareService,
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
    await this.assertAllowed(user);
    const sessionId = accessTokenPayload.launcherSession || await this.legacySessionId(user);
    const state = await this.hardware.session(sessionId, false);
    if (state.token.user.uuid !== user.uuid) throw new ForbiddenException();
    return new GravitSessionDto({ ...user, accessToken: state.minecraftAccessToken } as User, sessionId, state.hardware);
  }

  private async legacySessionId(user: User) {
    const payload = await this.tokensService.decodeToken(user.accessToken) as JWTMinecraftPayload;
    if (payload.type !== 'minecraft' || payload.sub !== user.uuid || !payload.ref) throw new ForbiddenException();
    return payload.ref;
  }

  private async assertAllowed(user: User) {
    if (user.password_change_required)
      throw new HttpException({ error: GravitError.PasswordChangeRequired }, HttpStatus.FORBIDDEN);

    if (!(await this.authService.isActivated(user))) throw new HttpException({ error: GravitError.UserNotActivated }, HttpStatus.FORBIDDEN);

    if (isBanActive(user.ban)) throw new HttpException({ error: GravitError.UserBlocked }, HttpStatus.FORBIDDEN);
  }

  async authorize(input: GravitAuthorize, ip?: string) {
    const password = input.password?.password ?? input.password?.firstPassword?.password;
    const totp = input.password?.secondPassword?.totp;
    const source = normalizeIp(input.context?.ip) || ip;
    const failed = (reason: string, user?: User) =>
      this.auditService.login({ login: input.login, user, ip: source, launcher: 'gravit', status: 'failure', reason });

    const user = await this.usersService.getByUsernameOrEmail(input.login);

    await this.loginAttemptsService.assert(input.login, source, user);

    if (!user) {
      await this.loginAttemptsService.fail(input.login, source);
      failed('unknown_user');
      throw new HttpException({ error: GravitError.UserNotFound }, HttpStatus.NOT_FOUND);
    }

    if (!password) throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);

    const valid = await this.authService.validateCredentials(user, password);
    if (!valid) {
      await this.loginAttemptsService.fail(input.login, source, user);
      failed('invalid_password', user);
      throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);
    }

    if (user.two_factor_enabled) {
      if (!totp) throw new HttpException({ error: GravitError.Require2FA }, HttpStatus.UNAUTHORIZED);

      if (!(await this.twoFactorService.verify(user, totp))) {
        await this.loginAttemptsService.fail(input.login, source, user);
        failed('invalid_totp', user);
        throw new HttpException({ error: GravitError.WrongPassword }, HttpStatus.UNAUTHORIZED);
      }
    }

    await this.loginAttemptsService.succeed(input.login, source, user);

    this.auditService.login({
      login: input.login,
      user,
      ip: source,
      launcher: 'gravit',
      totp: user.two_factor_enabled ?? false,
    });

    await this.assertAllowed(user);

    const refreshToken = await this.tokensService.generateRefreshToken(user, 'launcher', input?.context?.ip);
    const refreshTokenPayload = (await this.tokensService.decodeToken(refreshToken)) as JWTRefreshPayload;

    const accessToken = await this.tokensService.generateAccessToken(user, refreshTokenPayload.jwtid);

    user.accessToken = await this.tokensService.generateMinecraftAccessToken(user, refreshTokenPayload);
    await this.usersRepository.update({ uuid: user.uuid }, { accessToken: user.accessToken });
    await this.hardware.begin(refreshTokenPayload.jwtid, input.hardwareRequired === true, user.accessToken);

    return new GravitAuthReportDto(user, accessToken, refreshToken, refreshTokenPayload.jwtid);
  }

  async refreshAccessToken(input: GravitRefreshToken) {
    try {
      const { user, token } = await this.tokensService.resolveRefreshToken(input.refreshToken);
      await this.assertAllowed(user);
      const state = await this.hardware.session(token.uuid, false);
      const accessToken = await this.tokensService.generateAccessToken(user, token.uuid);
      return new GravitAuthReportDto({ ...user, accessToken: state.minecraftAccessToken } as User, accessToken, input.refreshToken, token.uuid, state.hardware);
    } catch (e) {
      if (e instanceof HttpException && e.getStatus() === HttpStatus.FORBIDDEN) throw e;
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

  async joinServer(input: GravitHardwareJoinInput) {
    try {
      var minecraftTokenPayload = (await this.tokensService.decodeToken(input.accessToken)) as JWTMinecraftPayload;
    } catch (e) {
      throw new ForbiddenException();
    }

    if (minecraftTokenPayload.type && minecraftTokenPayload.type != 'minecraft') throw new ForbiddenException();

    const state = await this.hardware.session(minecraftTokenPayload.ref, true);
    const token = state.token;
    if (state.required && input.hardwareId !== state.hardware?.id) throw new ForbiddenException();
    if (!token?.user || minecraftTokenPayload.sub !== token.user.uuid || !safeEqual(state.minecraftAccessToken, input.accessToken)) throw new ForbiddenException();
    if (input.username !== token.user.username || input.uuid && input.uuid !== token.user.uuid) throw new ForbiddenException();

    await this.assertAllowed(token.user);

    await this.hardware.recordJoin(token.user.uuid, input.serverId, token.id);
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
    await this.hardware.checkJoin(user.uuid, input.serverId);

    return new GravitUserDto(user);
  }
}
