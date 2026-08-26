import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import speakeasy from 'speakeasy';
import { User } from 'src/admin/users/entities/user.entity';
import { Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { TwoFactorInput } from '../dto/two_factor.input';
import {
  decryptField,
  encryptField,
  ENCRYPTED_TWO_FACTOR_SECRET,
  ENCRYPTED_TWO_FACTOR_SECRET_TEMP,
  TOTP_STEP_SECONDS,
  TOTP_WINDOW,
} from '@common';

@Injectable()
export class TwoFactorService {
  constructor(@InjectRepository(User) private usersService: Repository<User>) {}

  private secret(user: User): string {
    return decryptField(user.two_factor_secret, ENCRYPTED_TWO_FACTOR_SECRET, user.uuid);
  }

  private secretTemp(user: User): string {
    return decryptField(user.two_factor_secret_temp, ENCRYPTED_TWO_FACTOR_SECRET_TEMP, user.uuid);
  }

  private counterOf(delta: number): number {
    return Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS) + delta;
  }

  async verify(user: User, totp: string): Promise<boolean> {
    if (!user.two_factor_enabled || !user.two_factor_secret) return true;

    const delta = speakeasy.totp.verifyDelta({
      secret: this.secret(user),
      encoding: 'base32',
      token: totp,
      window: TOTP_WINDOW,
    });

    if (!delta) return false;

    const counter = this.counterOf(delta.delta);

    if (user.two_factor_counter != null && counter <= user.two_factor_counter) return false;

    const accepted = await this.usersService
      .createQueryBuilder()
      .update()
      .set({ two_factor_counter: counter })
      .where('uuid = :uuid AND (two_factor_counter IS NULL OR two_factor_counter < :counter)', { uuid: user.uuid, counter })
      .execute();

    if (!accepted.affected) return false;

    user.two_factor_counter = counter;

    return true;
  }

  async generate(user: User) {
    if (user.two_factor_enabled && user.two_factor_secret) throw new BadRequestException();

    const secret = speakeasy.generateSecret({ length: 12 });
    const otpauth_url = speakeasy.otpauthURL({ secret: secret.ascii, label: user.username, issuer: envConfig.sitename });

    user.two_factor_secret_temp = encryptField(secret.base32, ENCRYPTED_TWO_FACTOR_SECRET_TEMP, user.uuid);

    await this.usersService.update({ uuid: user.uuid }, { two_factor_secret_temp: user.two_factor_secret_temp });

    return { ...secret, otpauth_url };
  }

  async enable(user: User, input: TwoFactorInput) {
    if (user.two_factor_enabled && user.two_factor_secret) throw new BadRequestException();

    const tokenValidates = speakeasy.totp.verify({
      secret: this.secretTemp(user),
      encoding: 'base32',
      token: input.code,
      window: TOTP_WINDOW,
    });

    if (!tokenValidates) throw new BadRequestException();

    user.two_factor_enabled = true;
    user.two_factor_secret = encryptField(this.secretTemp(user), ENCRYPTED_TWO_FACTOR_SECRET, user.uuid);
    user.two_factor_secret_temp = null;

    await this.usersService.update(
      { uuid: user.uuid },
      { two_factor_enabled: true, two_factor_secret: user.two_factor_secret, two_factor_secret_temp: null },
    );
  }

  async disable(user: User, input: TwoFactorInput) {
    if (!user.two_factor_enabled || !user.two_factor_secret) return;

    if (!(await this.verify(user, input.code))) throw new BadRequestException();

    user.two_factor_enabled = null;
    user.two_factor_secret = null;
    user.two_factor_secret_temp = null;

    await this.usersService.update(
      { uuid: user.uuid },
      { two_factor_enabled: null, two_factor_secret: null, two_factor_secret_temp: null, two_factor_counter: null },
    );
  }
}
