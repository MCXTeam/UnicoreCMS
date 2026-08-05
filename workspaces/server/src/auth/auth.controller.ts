import {
  IpAddress,
  THROTTLE_PASSWORD_RESET,
  THROTTLE_REGISTER,
  THROTTLE_RESEND,
  THROTTLE_VERIFY,
  ThrottlerCoreGuard,
  UserAgent,
} from '@common';
import { Body, Controller, Delete, Get, Header, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { EmailService } from 'src/admin/email/email.service';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthenticatedDto } from './dto/authenticated.dto';
import { LoginInput } from './dto/login.input';
import { PasswordLinkInput } from './dto/password-link.input';
import { PasswordResetInput } from './dto/password-reset.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { RegisterInput } from './dto/register.input';
import { TokenInput } from './dto/token.input';
import { VerifyInput } from './dto/verify.input';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokensService } from './tokens.service';

@UseGuards(ThrottlerCoreGuard)
@Controller('auth')
export class AuthController {
  constructor(private tokensService: TokensService, private authService: AuthService, private emailService: EmailService) {}

  @Public()
  @Recaptcha({ action: 'login' })
  @Post('login')
  login(@Body() input: LoginInput, @UserAgent() agent: string, @IpAddress() ip: string): Promise<AuthenticatedDto> {
    return this.authService.login(input, agent, ip);
  }

  @Public()
  @Recaptcha({ action: 'register' })
  @Throttle({ default: THROTTLE_REGISTER })
  @Post('register')
  register(@Body() input: RegisterInput, @UserAgent() agent: string, @IpAddress() ip: string): Promise<AuthenticatedDto> {
    return this.authService.register(input, agent, ip);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() input: RefreshTokenInput, @UserAgent() agent: string, @IpAddress() ip: string): Promise<Omit<AuthenticatedDto, 'user'>> {
    return this.tokensService.createTokensFromRefreshToken(input.refresh_token, { agent, ip });
  }

  @Recaptcha({ action: 'verify' })
  @Throttle({ default: THROTTLE_VERIFY })
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

  @Post('logout')
  logout(@Body() input: RefreshTokenInput): Promise<void> {
    return this.tokensService.revokeRefreshToken(input.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: THROTTLE_RESEND })
  @Get('resend')
  resend(@CurrentUser() user: User) {
    return this.emailService.sendActivation(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User): { user: UserDto } {
    return { user: new UserDto(user) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/me')
  sessionsMe(@CurrentUser() user: User, @Body() input: TokenInput) {
    return this.tokensService.sessions(user, input.token);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions_all')
  closeMeSessions(@CurrentUser() user: User) {
    return this.tokensService.revokeRefreshTokensByUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions_other')
  closeMeOtherSessions(@CurrentUser() user: User, @Body() input: TokenInput) {
    return this.tokensService.revokeRefreshTokensByUserOther(user, input.token);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:uuid')
  closeMeSession(@CurrentUser() user: User, @Param('uuid') id: number) {
    return this.tokensService.revokeRefreshTokenBySessionAndUser(user, id);
  }
}
