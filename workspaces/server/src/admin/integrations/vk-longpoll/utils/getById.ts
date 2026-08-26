import { API } from 'vk-io';

import { IProfile } from './getPostAuthor';
import { VkAuthor } from './types';

export function getById(api: API, id?: number): Promise<IProfile | VkAuthor | null> {
  return id
    ? id > 0
      ? api.users
          .get({
            user_ids: String(id) as any,
            fields: ['photo_50'],
          })
          .then(([{ first_name, last_name, photo_50 }]) => ({
            name: `${first_name} ${last_name}`,
            photo_50,
          }))
      : api.groups
          .getById({
            group_id: String(Math.abs(id)),
          })
          .then(([group]: any) => group)
    : Promise.resolve(null);
}
