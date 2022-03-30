import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { PasswordChangeInput } from '../dto/password-change.input';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PasswordUpdateInput } from '../dto/password-update.input';

@Injectable()
export class SettingsService {
  constructor (
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokensRepo: Repository<RefreshToken>
  ) {}

  async updatePassword(user: User, input: PasswordUpdateInput) {
    user.password = bcrypt.hashSync(input.password, 10);
    await this.usersRepo.save(user)

    if (input.close)
      await this.tokensRepo.delete({ user })
  }

  async changePassword(user: User, input: PasswordChangeInput) {
    const compare = bcrypt.compareSync(input.password_old, user.password)
    if (!compare)
      throw new BadRequestException()

    user.password = bcrypt.hashSync(input.password, 10);
    await this.usersRepo.save(user)

    if (input.close)
      await this.tokensRepo.delete({ user })
  }
}
