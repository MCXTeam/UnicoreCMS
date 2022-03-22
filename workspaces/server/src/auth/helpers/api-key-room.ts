import { ApiToken } from 'src/admin/api/entities/api-token.entity';

export function ApiKeyRoom(user: ApiToken) {
  return `api-key:${user.secret}`;
}
