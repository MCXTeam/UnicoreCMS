import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuditService, isBanActive, PASSWORD_CHANGE_REQUIRED, REQUIRE_2FA } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { TwoFactorService } from 'src/game/cabinet/settings/providers/two_factor.service';
import { AuthService } from '../auth.service';
import { LoginAttemptsService } from '../attempts/login-attempts.service';
import { PasswordService } from '../password/password.service';
import { GmlAuthResultDto } from './dto/gml-auth-result.dto';
import { GmlLoginInput } from './dto/gml-login.input';

@Injectable()
export class GmlService {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private passwordService: PasswordService,
    private twoFactorService: TwoFactorService,
    private loginAttemptsService: LoginAttemptsService,
    private auditService: AuditService,
  ) {}

  async login(input: GmlLoginInput, ip?: string): Promise<GmlAuthResultDto> {
    const failed = (reason: string, user?: User) =>
      this.auditService.login({ login: input.Login, user, ip, launcher: 'gml', status: 'failure', reason });

    const user = await this.usersService.getByUsernameOrEmail(input.Login, ['skin', 'ban']);

    await this.loginAttemptsService.assert(input.Login, ip, user);

    if (!user) {
      await this.passwordService.fakeVerify(input.Password);
      await this.loginAttemptsService.fail(input.Login, ip);
      failed('unknown_user');
      throw new UnauthorizedException();
    }

    if (!(await this.authService.validateCredentials(user, input.Password))) {
      await this.loginAttemptsService.fail(input.Login, ip, user);
      failed('invalid_password', user);
      throw new UnauthorizedException();
    }

    if (user.two_factor_enabled) {
      if (!input.Totp) throw new UnauthorizedException(REQUIRE_2FA);

      if (!(await this.twoFactorService.verify(user, input.Totp))) {
        await this.loginAttemptsService.fail(input.Login, ip, user);
        failed('invalid_totp', user);
        throw new UnauthorizedException();
      }
    }

    await this.loginAttemptsService.succeed(input.Login, ip, user);

    this.auditService.login({ login: input.Login, user, ip, launcher: 'gml', totp: user.two_factor_enabled ?? false });

    if (user.password_change_required) throw new ForbiddenException(PASSWORD_CHANGE_REQUIRED);

    if (!(await this.authService.isActivated(user))) throw new ForbiddenException('User is not activated');

    if (isBanActive(user.ban)) throw new ForbiddenException('User is banned');

    return new GmlAuthResultDto({
      Login: user.username,
      UserUuid: user.uuid,
      IsSlim: user.skin?.slim ?? false,
    });
  }
}
