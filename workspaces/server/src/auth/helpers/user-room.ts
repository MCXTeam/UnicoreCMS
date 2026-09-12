import { User } from 'src/admin/users/entities/user.entity';

export function userRoom(user: Pick<User, 'uuid'> | string) {
  return `user:${typeof user === 'string' ? user : user.uuid}`;
}
