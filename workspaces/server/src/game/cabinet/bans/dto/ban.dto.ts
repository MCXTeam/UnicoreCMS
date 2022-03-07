import { Type } from "class-transformer";
import { UserDto } from "src/admin/users/dto/user.dto";
import { Ban } from "../entities/ban.entity";

export class BanDto {
  @Type(() => UserDto)
  user: UserDto;

  @Type(() => UserDto)
  actor: UserDto;

  reason: string;

  expires?: Number

  created: Date;

  constructor(partial: Partial<Ban>) {
    Object.assign(this, partial);
  }
}