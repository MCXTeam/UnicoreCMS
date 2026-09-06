import { ForbiddenException } from '@nestjs/common';
import { filterPanelPermissions, isDenyPattern, denyTarget, isPlayerPermission, Permission, satisfiesPermission } from 'unicore-common';
import { User } from '../users/entities/user.entity';
import { Role } from './entities/role.entity';
import { grantedPermissions, matchPermission, transformPermissions } from './guards/permisson.guard';

function panelPermissions(user: Partial<User>): string[] {
  return filterPanelPermissions(transformPermissions({ ...user, perms: [...(user.perms || [])] }).perms);
}

async function canManageSuperuser(actor: User): Promise<boolean> {
  return matchPermission(['panel.users.field.superuser'], { user: actor });
}

export async function userPermissionCheck(user: User, actor: User): Promise<boolean> {
  if (actor.superuser) return true;
  if (user.superuser && !(await canManageSuperuser(actor))) return false;

  const actorPerms = panelPermissions(actor);
  const targetPerms = panelPermissions({ ...user, superuser: false });

  return targetPerms.every((perm) => actorPerms.includes(perm));
}

export function roleGrantable(role: Role, actor: User): Promise<boolean> {
  return userPermissionCheck({ perms: [], roles: [role], superuser: false } as User, actor);
}

export async function assertGrantable(
  patterns: string[] = [],
  request: any,
  grant: Permission = 'panel.users.grant.panel',
): Promise<void> {
  if (request?.user?.superuser) return;

  const granted = await grantedPermissions(request);
  const panel = await matchPermission([grant], request);

  for (const pattern of patterns) {
    if (isDenyPattern(pattern)) continue;

    const target = denyTarget(pattern);

    if (!panel && !isPlayerPermission(target))
      throw new ForbiddenException(`Нельзя выдать право «${target}»: нет права выдавать права панели`);

    if (!satisfiesPermission(granted, target)) throw new ForbiddenException(`Нельзя выдать право «${target}»: его нет у вас`);
  }
}
