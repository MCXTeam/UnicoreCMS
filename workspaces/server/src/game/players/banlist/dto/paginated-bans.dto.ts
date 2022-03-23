import { instanceToPlain, Transform, Type } from "class-transformer";
import { Paginated } from "nestjs-paginate";
import { UserProtectedDto } from "src/admin/users/dto/user-protected.dto";

export class BanDto {
  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  actor?: UserProtectedDto;

  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  user: UserProtectedDto;

  constructor(partial: Partial<Paginated<History>>) {
    Object.assign(this, partial);
  }
}

export class PaginatedBansDto extends Paginated<Partial<BanDto>> {
  @Transform(({ value }) => value.map((v) => instanceToPlain(new BanDto(v))))
  data: BanDto[];

  constructor(partial: Partial<Paginated<any>>) {
    super();
    Object.assign(this, partial);
  }
}