import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { AuditService, cmsVersion, isBanActive } from '@common';
import { NewsService } from 'src/admin/news/news.service';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { TwoFactorService } from 'src/game/cabinet/settings/providers/two_factor.service';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { AuthService } from '../auth.service';
import { LoginAttemptsService } from '../attempts/login-attempts.service';
import { GravitError } from '../gravit/enums/gravit-error.enum';
import { PasswordService } from '../password/password.service';
import { LaminaraAuthenticateInput } from './dto/laminara-authenticate.input';
import { LaminaraNewsDto, LaminaraPingDto } from './dto/laminara-news.dto';
import { LaminaraProfileDto } from './dto/laminara-profile.dto';

@Injectable()
export class LaminaraService {
  constructor(
    @InjectRepository(UsersDonateGroup) private userGroupsRepo: Repository<UsersDonateGroup>,
    @InjectRepository(UsersDonatePermission) private userPermissionsRepo: Repository<UsersDonatePermission>,
    private usersService: UsersService,
    private authService: AuthService,
    private passwordService: PasswordService,
    private twoFactorService: TwoFactorService,
    private loginAttemptsService: LoginAttemptsService,
    private auditService: AuditService,
    private newsService: NewsService,
  ) {}

  ping(): LaminaraPingDto {
    return new LaminaraPingDto({ name: envConfig.sitename, version: cmsVersion() });
  }

  async authenticate(input: LaminaraAuthenticateInput, ip?: string): Promise<LaminaraProfileDto> {
    const failed = (reason: string, user?: User) =>
      this.auditService.login({ login: input.login, user, ip, launcher: 'laminara', status: 'failure', reason });

    const user = await this.usersService.getByUsernameOrEmail(input.login);

    await this.loginAttemptsService.assert(input.login, ip, user);

    if (!user) {
      await this.passwordService.fakeVerify(input.password);
      await this.loginAttemptsService.fail(input.login, ip);
      failed('unknown_user');
      throw this.error(GravitError.UserNotFound, HttpStatus.NOT_FOUND);
    }

    if (!(await this.authService.validateCredentials(user, input.password))) {
      await this.loginAttemptsService.fail(input.login, ip, user);
      failed('invalid_password', user);
      throw this.error(GravitError.WrongPassword, HttpStatus.UNAUTHORIZED);
    }

    if (user.two_factor_enabled) {
      if (!input.totp) throw this.error(GravitError.Require2FA, HttpStatus.UNAUTHORIZED);

      if (!(await this.twoFactorService.verify(user, input.totp))) {
        await this.loginAttemptsService.fail(input.login, ip, user);
        failed('invalid_totp', user);
        throw this.error(GravitError.Wrong2FA, HttpStatus.UNAUTHORIZED);
      }
    }

    await this.loginAttemptsService.succeed(input.login, ip, user);

    this.auditService.login({ login: input.login, user, ip, launcher: 'laminara', totp: user.two_factor_enabled ?? false });

    if (user.password_change_required) throw this.error(GravitError.PasswordChangeRequired, HttpStatus.FORBIDDEN);

    if (!(await this.authService.isActivated(user))) throw this.error(GravitError.UserNotActivated, HttpStatus.FORBIDDEN);

    if (isBanActive(user.ban)) throw this.error(GravitError.UserBlocked, HttpStatus.FORBIDDEN, user.ban?.reason);

    return this.profile(user);
  }

  async byUsername(username: string): Promise<LaminaraProfileDto> {
    return this.profile(await this.usersService.getByUsername(username));
  }

  async byUuid(uuid: string): Promise<LaminaraProfileDto> {
    return this.profile(await this.usersService.getById(uuid));
  }

  async news(limit: number): Promise<LaminaraNewsDto> {
    return new LaminaraNewsDto(await this.newsService.latest(limit));
  }

  private async profile(user: User | null): Promise<LaminaraProfileDto> {
    if (!user) throw this.error(GravitError.UserNotFound, HttpStatus.NOT_FOUND);

    const [groups, grants] = await Promise.all([
      this.userGroupsRepo.find({ where: { user: { uuid: user.uuid } } }),
      this.userPermissionsRepo.find({ where: { user: { uuid: user.uuid } } }),
    ]);

    return new LaminaraProfileDto(user, groups, grants);
  }

  private error(code: GravitError, status: HttpStatus, reason?: string): HttpException {
    return new HttpException(reason ? { error: code, reason } : { error: code }, status);
  }
}
