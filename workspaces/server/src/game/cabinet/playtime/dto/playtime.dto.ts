import { Exclude } from "class-transformer";
import { User } from "src/admin/users/entities/user.entity";
import { Playtime } from "../entities/playtime.entity";

export class PlaytimeDto {
  @Exclude()
  user: User

  constructor(partial: Partial<Playtime>) {
    Object.assign(this, partial);
  }
}