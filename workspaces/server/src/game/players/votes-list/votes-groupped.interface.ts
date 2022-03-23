import { User } from "src/admin/users/entities/user.entity";

export interface VotesGroupped {
  user: User;

  total: number;

  updated: Date;
}