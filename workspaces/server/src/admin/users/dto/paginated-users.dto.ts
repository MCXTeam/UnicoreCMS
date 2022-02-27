import { UserDto } from './user.dto';
import { Paginated } from 'nestjs-paginate';
import { Type } from 'class-transformer';
import { User } from '../entities/user.entity';

export class PaginatedUsersDto extends Paginated<UserDto> {
  @Type(() => UserDto)
  data: UserDto[];

  constructor(partial: Paginated<User>) {
    super();
    Object.assign(this, partial);
  }
}
