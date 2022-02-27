import { Exclude } from 'class-transformer';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { User } from '../entities/user.entity';

export class UserDto implements User {
  uuid: string;

  username: string;

  email: string;

  skin?: Skin;

  cloak?: Cloak;

  @Exclude()
  password: string;

  two_factor_enabled?: boolean;

  @Exclude()
  two_factor_secret?: string;

  @Exclude()
  two_factor_secret_temp?: string;

  superuser: boolean;

  activated: boolean;

  real: number;

  perms: string[];

  created: Date;

  updated: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
