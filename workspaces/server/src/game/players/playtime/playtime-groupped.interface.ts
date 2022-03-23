import { User } from "src/admin/users/entities/user.entity";

export interface PlaytimeGroupped {
  user: User;

  time: number;

  updated: Date;
}