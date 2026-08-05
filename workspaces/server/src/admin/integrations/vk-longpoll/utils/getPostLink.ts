import { VK_LINK_PREFIX } from 'src/common/constants';

export interface IGetPostLinkOptions {
  owner_id: number;
  id: number;
}

export function getPostLink({ owner_id, id }: IGetPostLinkOptions): string {
  return `${VK_LINK_PREFIX}wall${owner_id}_${id}`;
}
