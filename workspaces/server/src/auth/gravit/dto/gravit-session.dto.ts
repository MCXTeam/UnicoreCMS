import { GravitUserDto } from './gravit-user.dto';
import { nanoid } from 'nanoid';
import { User } from 'src/admin/users/entities/user.entity';
import { instanceToPlain } from 'class-transformer';
import { envConfig } from 'unicore-common';
import * as ms from 'ms';

export class GravitSessionDto {
  id: string;
  user: GravitUserDto;
  expireIn: number;

  constructor(user: User) {
    this.id = nanoid();
    this.expireIn = 0;
    this.user = instanceToPlain(new GravitUserDto(user)) as GravitUserDto;
  }
}
