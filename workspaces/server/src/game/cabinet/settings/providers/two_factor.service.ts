import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Secret, TOTP } from 'otpauth';
import { User } from 'src/admin/users/entities/user.entity';
import { Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { TwoFactorInput } from '../dto/two_factor.input';
import {
  decryptField,
  encryptField,
  ENCRYPTED_TWO_FACTOR_SECRET,
  ENCRYPTED_TWO_FACTOR_SECRET_TEMP,
  TOTP_DIGITS,
  TOTP_SECRET_BYTES,
  TOTP_STEP_SECONDS,
  TOTP_WINDOW,
} from '@common';

@Injectable()
export class TwoFactorService {
  constructor(@InjectRepository(User) private usersService: Repository<User>) {}

  private totp(user: User, base32: string): TOTP {
    return new TOTP({
      issuer: envConfig.sitename,
      label: user.username,
      digits: TOTP_DIGITS,
      period: TOTP_STEP_SECONDS,
      secret: Secret.fromBase32(base32),
    });
  }

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

    const delta = this.totp(user, this.secret(user)).validate({ token: totp, window: TOTP_WINDOW });

    if (delta === null) return false;

    const counter = this.counterOf(delta);

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

    const base32 = new Secret({ size: TOTP_SECRET_BYTES }).base32;

    user.two_factor_secret_temp = encryptField(base32, ENCRYPTED_TWO_FACTOR_SECRET_TEMP, user.uuid);

    await this.usersService.update({ uuid: user.uuid }, { two_factor_secret_temp: user.two_factor_secret_temp });

    return { base32, otpauth_url: this.totp(user, base32).toString() };
  }

  async enable(user: User, input: TwoFactorInput) {
    if (user.two_factor_enabled && user.two_factor_secret) throw new BadRequestException();

    const base32 = this.secretTemp(user);

    if (this.totp(user, base32).validate({ token: input.code, window: TOTP_WINDOW }) === null) throw new BadRequestException();

    user.two_factor_enabled = true;
    user.two_factor_secret = encryptField(base32, ENCRYPTED_TWO_FACTOR_SECRET, user.uuid);
    user.two_factor_secret_temp = null;

    await this.usersService.update(
      { uuid: user.uuid },
      { two_factor_enabled: true, two_factor_secret: user.two_factor_secret, two_factor_secret_temp: null },
    );
  }

  async disable(user: User, input: TwoFactorInput) {
    if (!user.two_factor_enabled || !user.two_factor_secret) return;

    if (!(await this.verify(user, input.code))) throw new BadRequestException();

    return this.reset(user);
  }

  async reset(user: User) {
    user.two_factor_enabled = null;
    user.two_factor_secret = null;
    user.two_factor_secret_temp = null;

    await this.usersService.update(
      { uuid: user.uuid },
      { two_factor_enabled: null, two_factor_secret: null, two_factor_secret_temp: null, two_factor_counter: null },
    );
  }
}
