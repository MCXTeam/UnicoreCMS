import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PasswordChangeInput } from '../dto/password-change.input';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PasswordUpdateInput } from '../dto/password-update.input';
import { PasswordService } from 'src/auth/password/password.service';
import { PasswordPolicyService } from 'src/auth/password/password-policy.service';
import { passwordAad } from 'src/auth/password/password-aad';
import { events } from 'unicore-api';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokensRepo: Repository<RefreshToken>,
    private passwordService: PasswordService,
    private passwordPolicyService: PasswordPolicyService,
  ) {}

  private async setPassword(user: User, password: string) {
    await this.passwordPolicyService.assert(password, { username: user.username, email: user.email });

    user.password = await this.passwordService.hash(password, passwordAad(user.uuid));

    await this.usersRepo.update({ uuid: user.uuid }, { password: user.password });

    await events().emit('user.password.changed', { uuid: user.uuid, username: user.username });
  }

  async closeSessions(user: User) {
    await this.tokensRepo.delete({ user: { uuid: user.uuid } });
  }

  async updatePassword(user: User, input: PasswordUpdateInput) {
    await this.setPassword(user, input.password);
    await this.closeSessions(user);
  }

  async changePassword(user: User, input: PasswordChangeInput) {
    const { valid } = await this.passwordService.verify(input.password_old, user.password, passwordAad(user.uuid));
    if (!valid) throw new BadRequestException();

    await this.setPassword(user, input.password);

    if (input.close) await this.closeSessions(user);
  }
}
