import { User } from "src/admin/users/entities/user.entity";

export interface VotesGroupped {
  ids?: number[];

  user: User;

  total: number;

  updated: Date;
}