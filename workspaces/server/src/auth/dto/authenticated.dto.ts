import { instanceToPlain } from 'class-transformer';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { User } from 'src/admin/users/entities/user.entity';

export class AuthenticatedDto {
  accessToken: string;

  refreshToken: string;

  user: UserDto;

  constructor(partial: Partial<{ accessToken: string; refreshToken: string; user: User }>) {
    this.accessToken = partial.accessToken;
    this.refreshToken = partial.refreshToken;
    this.user = instanceToPlain(new UserDto(partial.user)) as UserDto;
  }
}
