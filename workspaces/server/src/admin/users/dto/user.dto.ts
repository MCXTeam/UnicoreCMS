import { Exclude, Transform } from 'class-transformer';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { User } from '../entities/user.entity';
import { transformPermissions } from 'src/admin/roles/guards/permisson.guard';

export class UserDto {
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

  roles: string[];

  created: Date;

  updated: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, transformPermissions(partial));
  }
}

export class UserBasicDto {
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

  roles: string[];

  created: Date;

  updated: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

