import { User } from 'src/admin/users/entities/user.entity';

export function userRoom(user: User) {
  return `user:${user.uuid}`;
}
