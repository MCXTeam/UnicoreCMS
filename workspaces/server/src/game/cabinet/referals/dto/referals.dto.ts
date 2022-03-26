import { Exclude, instanceToPlain, Transform } from "class-transformer";
import { UserProtectedDto } from "src/admin/users/dto/user-protected.dto";
import { User } from "src/admin/users/entities/user.entity";
import { PlaytimeDto } from "../../playtime/dto/playtime.dto";
import { Referal } from "../entities/referal.entity";

export class ReferalDto {
  @Exclude()
  inviter: UserProtectedDto;

  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  user: User

  constructor(partial: Partial<Referal & { playtime: number}>) {
    Object.assign(this, partial);
  }
}