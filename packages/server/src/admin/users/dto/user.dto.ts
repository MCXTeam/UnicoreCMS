import { Exclude } from 'class-transformer';
import { User } from '../entities/user.entity';

export class UserDto implements User {
  uuid: string;

  username: string;

  email: string;

  @Exclude()
  password: string;

  superuser: boolean;

  activated: boolean;

  money: number;

  real: number;

  perms: string[];

  created: Date;

  updated: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
