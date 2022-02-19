import { IpAddress, ThrottlerCoreGuard, UserAgent } from '@common';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { EmailService } from 'src/admin/email/email.service';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthenticatedDto } from './dto/authenticated.dto';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { VerifyInput } from './dto/verify.input';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokensService } from './tokens.service';

@UseGuards(ThrottlerCoreGuard)
@Controller('auth')
export class AuthController {
  constructor(private tokensService: TokensService, private authService: AuthService, private emailService: EmailService) { }

  @Public()
  @Recaptcha({ action: 'login' })
  @Post('login')
  login(@Body() input: LoginInput, @UserAgent() agent: string, @IpAddress() ip: string): Promise<AuthenticatedDto> {
    return this.authService.login(input, agent, ip);
  }

  @Public()
  @Recaptcha({ action: 'register' })
  @Post('register')
  register(@Body() input: RegisterInput, @UserAgent() agent: string, @IpAddress() ip: string): Promise<AuthenticatedDto> {
    return this.authService.register(input, agent, ip);
  }

  @Public()
  @Post('refresh')
  refresh(
    @Body('refresh_token') token: string,
    @UserAgent() agent: string,
    @IpAddress() ip: string,
  ): Promise<Omit<AuthenticatedDto, 'user'>> {
    return this.tokensService.createTokensFromRefreshToken(token, agent, ip);
  }

  @Recaptcha({ action: 'verify' })
  @Post('verify')
  verify(@CurrentUser() user: User, @Body() input: VerifyInput): Promise<UserDto> {
    return this.emailService.checkCode(user, input);
  }

  @Post('logout')
  logout(@Body('refresh_token') token: string): Promise<void> {
    return this.tokensService.revokeRefreshToken(token);
  }

  @Get("resend")
  resend(@CurrentUser() user: User) {
    return this.emailService.sendActivation(user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User): { user: UserDto } {
    return { user: new UserDto(user) };
  }
}
