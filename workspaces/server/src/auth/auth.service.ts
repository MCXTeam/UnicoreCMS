import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import * as bcrypt from 'bcrypt';
import { TokensService } from './tokens.service';
import { LoginInput } from './dto/login.input';
import { AuthenticatedDto } from './dto/authenticated.dto';
import { RegisterInput } from './dto/register.input';
import { EmailService } from 'src/admin/email/email.service';
import { TwoFactorService } from 'src/game/cabinet/settings/providers/two_factor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private tokensService: TokensService,
    private usersService: UsersService,
    private emailService: EmailService,
    private twoFactorService: TwoFactorService,
    @InjectRepository(Referal)
    private referalsRepository: Repository<Referal>,
  ) {}

  async validateCredentials(user: User, password: string) {
    return bcrypt.compare(password, user.password);
  }

  async login(body: LoginInput, agent?: string, ip?: string): Promise<AuthenticatedDto> {
    const { username_or_email, password } = body;
    const user = await this.usersService.getByUsernameOrEmail(username_or_email, ['skin', 'cloak', 'roles']);
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = await this.validateCredentials(user, password);

    if (!valid) {
      throw new UnauthorizedException();
    }

    if (user.two_factor_enabled) {
      if (!body.totp) throw new UnauthorizedException('require2fa');

      if (!this.twoFactorService.verify(user, body.totp)) throw new UnauthorizedException();
    }

    const accessToken = await this.tokensService.generateAccessToken(user);
    const refreshToken = await this.tokensService.generateRefreshToken(user, agent, ip);

    return new AuthenticatedDto({ accessToken, refreshToken, user });
  }

  async register(input: RegisterInput, agent?: string, ip?: string) {
    try {
      const { username, email, password } = input;
      const user = await this.usersService.create({ username, email, password });

      this.emailService.sendActivation(user);
      const accessToken = await this.tokensService.generateAccessToken(user);
      const refreshToken = await this.tokensService.generateRefreshToken(user, agent, ip);

      if (input.ref) {
        const inviter = await this.usersService.getByUsername(input.ref)

        if (inviter) {
          const referal = new Referal()
          referal.inviter = inviter
          referal.user = user
          await this.referalsRepository.save(referal)
        }
      }

      return new AuthenticatedDto({ accessToken, refreshToken, user });
    } catch {
      throw new ConflictException();
    }
  }

  logout(refresh_token: string): void {
    this.tokensService.revokeRefreshToken(refresh_token);
  }
}
