import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import * as bcrypt from 'bcrypt';
import { TokensService } from './tokens.service';
import { LoginInput } from './dto/login.input';
import { AuthenticatedDto } from './dto/authenticated.dto';

@Injectable()
export class AuthService {
  constructor (
    private tokensService:  TokensService,
    private usersService: UsersService
  ) {}

  async validateCredentials(user: User, password: string) {
    return bcrypt.compare(password, user.password)
  }

  async login(body: LoginInput, agent?: string, ip?: string): Promise<AuthenticatedDto> {
    try {
      const { username_or_email, password } = body
      const user = await this.usersService.getByUsernameOrEmail(username_or_email, ['skin', 'cloak', 'roles'])
      if (!user) {
        throw new UnauthorizedException()
      }

      const valid = await this.validateCredentials(user, password)

      if (!valid) {
        throw new UnauthorizedException()
      }

      const accessToken = await this.tokensService.generateAccessToken(user)
      const refreshToken = await this.tokensService.generateRefreshToken(user, agent, ip)

      return { accessToken, refreshToken, user }
    } catch {
      throw new UnauthorizedException()
    }
  }

  logout(refresh_token: string): void {
    this.tokensService.revokeRefreshToken(refresh_token)
  }
}
