import { Exclude, instanceToPlain, Transform } from "class-transformer";
import { UserProtectedDto } from "src/admin/users/dto/user-protected.dto";
import { User } from "src/admin/users/entities/user.entity";
import { Referal } from "../entities/referal.entity";

export class InviterDto {
  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  inviter: UserProtectedDto;

  @Exclude()
  user: User

  constructor(partial: Partial<Referal>) {
    Object.assign(this, partial);
  }
}