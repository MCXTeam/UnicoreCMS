import { Exclude, Expose, instanceToPlain, Transform } from 'class-transformer';
import { User } from 'src/admin/users/entities/user.entity';
import * as _ from 'lodash';

import { SkinDto } from 'src/game/cabinet/skin/dto/skin.dto';
import { CloakDto } from 'src/game/cabinet/skin/dto/cloak.dto';
import { Role } from 'src/admin/roles/entities/role.entity';
import { transformPermissions } from 'src/admin/roles/guards/permisson.guard';

export class GravitPermissions {
  perms: string[];
  roles: string[];
}

@Exclude()
export class GravitUserDto {
  perms: string[];
  roles: Role[];

  @Expose()
  username: string;

  @Expose()
  uuid: string;

  @Expose()
  accessToken: string;

  @Expose()
  get permissions(): GravitPermissions {
    return {
      perms: this.perms,
      roles: this.roles.map((role) => role.id),
    };
  }

  @Expose()
  @Transform(({ value }) => (value ? instanceToPlain(new SkinDto(value)) : null))
  skin?: SkinDto;

  @Expose()
  @Transform(({ value }) => (value ? instanceToPlain(new CloakDto(value)) : null))
  cloak?: CloakDto;

  constructor(partial: Partial<User>) {
    Object.assign(this, transformPermissions(partial));
  }
}
