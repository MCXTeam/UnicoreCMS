import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PasswordChangeInput } from '../dto/password-change.input';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PasswordUpdateInput } from '../dto/password-update.input';
import { PasswordService } from 'src/auth/password/password.service';
import { passwordAad } from 'src/auth/password/password-aad';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokensRepo: Repository<RefreshToken>,
    private passwordService: PasswordService,
  ) {}

  async updatePassword(user: User, input: PasswordUpdateInput) {
    user.password = await this.passwordService.hash(input.password, passwordAad(user.uuid));
    await this.usersRepo.save(user);

    if (input.close) await this.tokensRepo.delete({ user });
  }

  async changePassword(user: User, input: PasswordChangeInput) {
    const { valid } = await this.passwordService.verify(input.password_old, user.password, passwordAad(user.uuid));
    if (!valid) throw new BadRequestException();

    user.password = await this.passwordService.hash(input.password, passwordAad(user.uuid));
    await this.usersRepo.save(user);

    if (input.close) await this.tokensRepo.delete({ user });
  }
}
