import { Type } from 'class-transformer';
import { UserDto } from 'src/admin/users/dto/user.dto';

export class AuthenticatedDto {
  accessToken: string;

  refreshToken: string;

  @Type(() => UserDto)
  user: UserDto;

  constructor(partial: Partial<AuthenticatedDto>) {
    Object.assign(this, partial);
  }
}
