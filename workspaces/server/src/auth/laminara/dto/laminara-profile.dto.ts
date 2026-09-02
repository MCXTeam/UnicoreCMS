import { isBanActive, StorageManager } from '@common';
import { resolvePermissions } from 'unicore-common';
import { User } from 'src/admin/users/entities/user.entity';
import { transformPermissions } from 'src/admin/roles/guards/permisson.guard';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';

export interface LaminaraTextures {
  skin?: { url: string; slim: boolean };
  cape?: { url: string };
}

export class LaminaraProfileDto {
  uuid: string;
  username: string;
  roles: string[];
  groups: string[];
  permissions: string[];
  banned: boolean;
  banReason: string;
  textures: LaminaraTextures;

  constructor(user: User, groups: UsersDonateGroup[], grants: UsersDonatePermission[]) {
    const resolved = transformPermissions(user);
    const active = <T extends { expired?: Date }>(rows: T[]) => rows.filter((row) => !row.expired || row.expired > new Date());
    const activeGroups = active(groups);
    const activeGrants = active(grants);
    const donated = [
      ...activeGroups.map((row) => row.group?.web_perms || []),
      ...activeGrants.map((row) => row.permission?.web_perms || []),
    ].flat();

    this.uuid = user.uuid;
    this.username = user.username;
    this.roles = (user.roles || []).map((role) => role.id);
    this.groups = Array.from(new Set(activeGroups.map((row) => row.group?.ingame_id).filter(Boolean)));
    this.permissions = Array.from(new Set([...resolved.perms, ...(donated.length ? resolvePermissions(donated) : [])]));
    this.banned = isBanActive(user.ban);
    this.banReason = this.banned ? user.ban?.reason || '' : '';
    this.textures = {
      skin: user.skin ? { url: StorageManager.url(user.skin.file), slim: Boolean(user.skin.slim) } : undefined,
      cape: user.cloak ? { url: StorageManager.url(user.cloak.file) } : undefined,
    };
  }
}
