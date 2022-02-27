import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as speakeasy from 'speakeasy'
import { User } from 'src/admin/users/entities/user.entity';
import { Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { TwoFactorInput } from '../dto/two_factor.input';

@Injectable()
export class TwoFactorService {
  constructor(@InjectRepository(User) private usersService: Repository<User>) { }

  verify(user: User, totp: string) {
    if (!user.two_factor_enabled || !user.two_factor_secret)
      return true

    return speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: totp
    });
  }

  async generate(user: User) {
    if (user.two_factor_enabled && user.two_factor_secret)
      throw new BadRequestException()

    const secret = speakeasy.generateSecret({ length: 12 });
    const otpauth_url = speakeasy.otpauthURL({ secret: secret.ascii, label: envConfig.sitename, algorithm: 'sha512' })
    user.two_factor_secret_temp = secret.base32;

    await this.usersService.save(user)

    return { ...secret, otpauth_url }
  }

  async enable(user: User, input: TwoFactorInput) {
    if (user.two_factor_enabled && user.two_factor_secret)
      throw new BadRequestException()

    const tokenValidates = speakeasy.totp.verify({
      secret: user.two_factor_secret_temp,
      encoding: 'base32',
      token: input.code
    });

    if (!tokenValidates)
      throw new BadRequestException()

    user.two_factor_enabled = true
    user.two_factor_secret = user.two_factor_secret_temp
    user.two_factor_secret_temp = null

    await this.usersService.save(user)
  }

  async disable(user: User, input: TwoFactorInput) {
    if (!user.two_factor_enabled || !user.two_factor_secret)
      return

    if (!this.verify(user, input.code))
      throw new BadRequestException()

    user.two_factor_enabled = null
    user.two_factor_secret = null
    user.two_factor_secret_temp = null

    await this.usersService.save(user)
  }
}
