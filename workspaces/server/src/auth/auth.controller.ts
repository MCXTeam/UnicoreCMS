import {
  IpAddress,
  Locale,
  THROTTLE_LOGIN,
  THROTTLE_PASSWORD_RESET,
  THROTTLE_REFRESH,
  THROTTLE_REGISTER,
  THROTTLE_SESSION,
  THROTTLE_RESEND,
  THROTTLE_VERIFY,
  ThrottlerCoreGuard,
  UserAgent,
} from '@common';
import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { EmailService } from 'src/admin/email/email.service';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthCookiesService } from './cookies/auth-cookies.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AllowInactive } from './decorators/allow-inactive.decorator';
import { AllowPasswordPending } from './decorators/allow-password-pending.decorator';
import { AuthenticatedDto } from './dto/authenticated.dto';
import { LoginInput } from './dto/login.input';
import { PasswordLinkInput } from './dto/password-link.input';
import { PasswordResetInput } from './dto/password-reset.input';
import { playerPermissions } from 'src/admin/roles/guards/permisson.guard';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { RegisterInput } from './dto/register.input';
import { TokenInput } from './dto/token.input';
import { VerifyInput } from './dto/verify.input';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokensService } from './tokens.service';

@UseGuards(ThrottlerCoreGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private tokensService: TokensService,
    private authService: AuthService,
    private emailService: EmailService,
    private cookies: AuthCookiesService,
  ) {}

  @Public()
  @Recaptcha({ action: 'login' })
  @Throttle({ default: THROTTLE_LOGIN })
  @Post('login')
  async login(
    @Body() input: LoginInput,
    @UserAgent() agent: string,
    @IpAddress() ip: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthenticatedDto> {
    const authenticated = await this.authService.login(input, agent, ip);

    this.cookies.issue(response, authenticated.refreshToken);

    return authenticated;
  }

  @Public()
  @Recaptcha({ action: 'register' })
  @Throttle({ default: THROTTLE_REGISTER })
  @Post('register')
  async register(
    @Body() input: RegisterInput,
    @UserAgent() agent: string,
    @IpAddress() ip: string,
    @Locale() locale: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthenticatedDto> {
    const authenticated = await this.authService.register(input, agent, ip, locale);

    this.cookies.issue(response, authenticated.refreshToken);

    return authenticated;
  }

  @Public()
  @Throttle({ default: THROTTLE_REFRESH })
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Body() input: RefreshTokenInput,
    @UserAgent() agent: string,
    @IpAddress() ip: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthenticatedDto, 'user'>> {
    const fromCookie = this.cookies.present(request);
    const tokens = await this.tokensService.createTokensFromRefreshToken(this.cookies.resolve(request, input.refresh_token), {
      agent,
      ip,
    });

    if (fromCookie) this.cookies.issue(response, tokens.refreshToken);

    return tokens;
  }

  @AllowInactive()
  @Recaptcha({ action: 'verify' })
  @Throttle({ default: THROTTLE_VERIFY })
  @AllowPasswordPending()
  @Post('verify')
  verify(@CurrentUser() user: User, @Body() input: VerifyInput): Promise<UserDto> {
    return this.emailService.checkCode(user, input);
  }

  @Public()
  @Recaptcha({ action: 'reset' })
  @Throttle({ default: THROTTLE_PASSWORD_RESET })
  @Post('reset')
  resetReq(@IpAddress() ip: string, @Body() input: PasswordLinkInput) {
    return this.emailService.sendPasswordLink(ip, input);
  }

  @Public()
  @Recaptcha({ action: 'reset' })
  @Throttle({ default: THROTTLE_PASSWORD_RESET })
  @Post('password')
  reset(@Body() input: PasswordResetInput): Promise<UserDto> {
    return this.emailService.checkHash(input);
  }

  @AllowInactive()
  @Throttle({ default: THROTTLE_SESSION })
  @AllowPasswordPending()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Body() input: RefreshTokenInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.tokensService.revokeRefreshToken(this.cookies.resolve(request, input.refresh_token));

    this.cookies.clear(response);
  }

  @AllowInactive()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: THROTTLE_RESEND })
  @AllowPasswordPending()
  @Get('resend')
  resend(@CurrentUser() user: User) {
    return this.emailService.sendActivation(user);
  }

  @AllowInactive()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: THROTTLE_SESSION })
  @AllowPasswordPending()
  @Get('me')
  async me(@Req() request: any, @CurrentUser() user: User): Promise<{ user: UserDto; cookieAuth: boolean }> {
    return { user: new UserDto(user, await playerPermissions(request)), cookieAuth: this.cookies.present(request) };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: THROTTLE_SESSION })
  @AllowPasswordPending()
  @Post('sessions/me')
  sessionsMe(@Req() request: Request, @CurrentUser() user: User, @Body() input: TokenInput) {
    return this.tokensService.sessions(user, this.cookies.resolve(request, input.token));
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: THROTTLE_SESSION })
  @AllowPasswordPending()
  @Delete('sessions_all')
  async closeMeSessions(@CurrentUser() user: User, @Res({ passthrough: true }) response: Response) {
    await this.tokensService.revokeRefreshTokensByUser(user);

    this.cookies.clear(response);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: THROTTLE_SESSION })
  @AllowPasswordPending()
  @Delete('sessions_other')
  closeMeOtherSessions(@Req() request: Request, @CurrentUser() user: User, @Body() input: TokenInput) {
    return this.tokensService.revokeRefreshTokensByUserOther(user, this.cookies.resolve(request, input.token));
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: THROTTLE_SESSION })
  @AllowPasswordPending()
  @Delete('sessions/:uuid')
  closeMeSession(@CurrentUser() user: User, @Param('uuid') id: number) {
    return this.tokensService.revokeRefreshTokenBySessionAndUser(user, id);
  }
}
