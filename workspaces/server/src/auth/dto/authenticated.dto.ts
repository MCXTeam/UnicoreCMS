import { instanceToPlain, Type } from 'class-transformer';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { User } from 'src/admin/users/entities/user.entity';

export class AuthenticatedDto {
  accessToken: string;

  refreshToken: string;

  user: UserDto;

  constructor(partial: Partial<{accessToken: string, refreshToken: string,  user: User }>) {
    this.user = instanceToPlain(new UserDto(partial.user)) as UserDto
    Object.assign(this, partial);
  }
}
