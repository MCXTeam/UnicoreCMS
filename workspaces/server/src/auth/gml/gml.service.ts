import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { isBanActive, REQUIRE_2FA } from '@common';
import { UsersService } from 'src/admin/users/users.service';
import { TwoFactorService } from 'src/game/cabinet/settings/providers/two_factor.service';
import { AuthService } from '../auth.service';
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
  ) {}

  async login(input: GmlLoginInput): Promise<GmlAuthResultDto> {
    const user = await this.usersService.getByUsernameOrEmail(input.Login, ['skin', 'ban']);

    if (!user) {
      await this.passwordService.fakeVerify(input.Password);
      throw new UnauthorizedException();
    }

    if (!(await this.authService.validateCredentials(user, input.Password))) throw new UnauthorizedException();

    if (user.two_factor_enabled) {
      if (!input.Totp) throw new UnauthorizedException(REQUIRE_2FA);

      if (!(await this.twoFactorService.verify(user, input.Totp))) throw new UnauthorizedException();
    }

    if (!(await this.authService.isActivated(user))) throw new ForbiddenException('User is not activated');

    if (isBanActive(user.ban)) throw new ForbiddenException('User is banned');

    return new GmlAuthResultDto({
      Login: user.username,
      UserUuid: user.uuid,
      IsSlim: user.skin?.slim ?? false,
    });
  }
}
