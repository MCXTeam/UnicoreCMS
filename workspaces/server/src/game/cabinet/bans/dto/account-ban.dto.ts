import { instanceToPlain, Transform } from 'class-transformer';
import { UserProtectedDto } from 'src/admin/users/dto/user-protected.dto';

export class BanDto {
  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  actor?: UserProtectedDto;

  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  user: UserProtectedDto;

  constructor(partial: Partial<BanDto>) {
    Object.assign(this, partial);
  }
}
