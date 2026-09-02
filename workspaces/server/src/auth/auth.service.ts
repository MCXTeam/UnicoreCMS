import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { REQUIRE_2FA } from '@common';
import { events } from 'unicore-api';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { TokensService } from './tokens.service';
import { LoginInput } from './dto/login.input';
import { AuthenticatedDto } from './dto/authenticated.dto';
import { RegisterInput } from './dto/register.input';
import { EmailService } from 'src/admin/email/email.service';
import { TwoFactorService } from 'src/game/cabinet/settings/providers/two_factor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { PasswordService } from './password/password.service';
import { passwordAad } from './password/password-aad';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { LoginAttemptsService } from './attempts/login-attempts.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private tokensService: TokensService,
    private passwordService: PasswordService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private configService: ConfigService,
    private emailService: EmailService,
    private twoFactorService: TwoFactorService,
    private loginAttemptsService: LoginAttemptsService,
    @InjectRepository(Referal)
    private referalsRepository: Repository<Referal>,
  ) {}

  async validateCredentials(user: User, password: string): Promise<boolean> {
    const { valid, rehashed } = await this.passwordService.verify(password, user.password, passwordAad(user.uuid));

    if (valid && rehashed) {
      user.password = rehashed;
      await this.usersRepository.update({ uuid: user.uuid }, { password: rehashed });
    }

    return valid;
  }

  async isActivated(user: User): Promise<boolean> {
    if (user.activated || user.superuser) return true;

    const cfg = await this.configService.load();

    return !cfg[ConfigField.EmailActivationRequired];
  }

  async login(body: LoginInput, agent?: string, ip?: string): Promise<AuthenticatedDto> {
    const { username_or_email, password } = body;

    await this.loginAttemptsService.assert(username_or_email, ip);

    const user = await this.usersService.getByUsernameOrEmail(username_or_email, ['skin', 'cloak', 'roles']);
    if (!user) {
      await this.passwordService.fakeVerify(password);
      await this.loginAttemptsService.fail(username_or_email, ip);
      throw new UnauthorizedException();
    }

    const valid = await this.validateCredentials(user, password);

    if (!valid) {
      await this.loginAttemptsService.fail(username_or_email, ip);
      throw new UnauthorizedException();
    }

    if (user.two_factor_enabled) {
      if (!body.totp) throw new UnauthorizedException(REQUIRE_2FA);

      if (!(await this.twoFactorService.verify(user, body.totp))) {
        await this.loginAttemptsService.fail(username_or_email, ip);
        throw new UnauthorizedException();
      }
    }

    await this.loginAttemptsService.succeed(username_or_email, ip);

    const accessToken = await this.tokensService.generateAccessToken(user);
    const refreshToken = await this.tokensService.generateRefreshToken(user, agent, ip);

    await events().emit('user.login', { uuid: user.uuid, username: user.username, ip });

    return new AuthenticatedDto({ accessToken, refreshToken, user });
  }

  private async attachReferal(user: User, ref: string) {
    try {
      const inviter = await this.usersService.getByUsername(ref);

      if (!inviter || inviter.uuid === user.uuid) return;

      const referal = new Referal();
      referal.inviter = inviter;
      referal.user = user;

      await this.referalsRepository.save(referal);
    } catch (e) {
      this.logger.error(`Не удалось привязать реферала для ${user.uuid}: ${e}`);
    }
  }

  async register(input: RegisterInput, agent?: string, ip?: string, locale?: string) {
    const { username, email, password } = input;
    const cfg = await this.configService.load();
    const activationRequired = Boolean(cfg[ConfigField.EmailActivationRequired]) && !cfg[ConfigField.OrdinaryRegister];

    let user: User;

    try {
      user = await this.usersService.create({ username, email, password, activated: !activationRequired, locale });
    } catch (e) {
      if (e instanceof QueryFailedError && (e.driverError?.code === 'ER_DUP_ENTRY' || e.driverError?.code === '23505'))
        throw new ConflictException();

      throw e;
    }

    if (activationRequired)
      this.emailService.sendActivation(user).catch((e) => this.logger.error(`Не удалось отправить письмо активации ${user.uuid}: ${e}`));

    const accessToken = await this.tokensService.generateAccessToken(user);
    const refreshToken = await this.tokensService.generateRefreshToken(user, agent, ip);

    if (input.ref) await this.attachReferal(user, input.ref);

    await events().emit('user.registered', { uuid: user.uuid, username: user.username, email: user.email });

    return new AuthenticatedDto({ accessToken, refreshToken, user });
  }
}
