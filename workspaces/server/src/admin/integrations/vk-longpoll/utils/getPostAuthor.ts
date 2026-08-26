import { IWallPostContextPayload } from 'vk-io';
import { VkAuthor } from './types';

export interface IProfile {
  name: string;
  photo_50?: string;
}

export function getPostAuthor(post: IWallPostContextPayload, profiles: VkAuthor[], groups: VkAuthor[]): IProfile | VkAuthor {
  const author: VkAuthor[] =
    (post.from_id as number) > 0
      ? profiles.filter(({ id }) => id === post.from_id)
      : groups.filter(({ id }) => id === Math.abs(post.from_id as number));

  return author.map((profile: VkAuthor) => {
    const { name, photo_50, first_name, last_name } = profile;

    if (name) {
      return profile;
    } else {
      return {
        name: `${first_name} ${last_name}`,
        photo_50,
      } as IProfile;
    }
  })[0];
}
