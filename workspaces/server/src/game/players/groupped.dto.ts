import { instanceToPlain, Transform } from "class-transformer";
import { UserProtectedDto } from "src/admin/users/dto/user-protected.dto";

export class GrouppedDto {
  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  user: UserProtectedDto;

  constructor(partial: Partial<any>) {
    Object.assign(this, partial);
  }
}

export class GrouppedPaginate {
  @Transform(({ value }) => value.map((v) => instanceToPlain(new GrouppedDto(v))))
  data: GrouppedDto[]

  constructor(partial: Partial<any>) {
    Object.assign(this, partial);
  }
}