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

export async function roleGrantable(role: Role, actor: User): Promise<boolean> {
  if (!outranksRole(role, actor)) return false;

  return userPermissionCheck({ perms: [], roles: [role], superuser: false } as User, actor);
}

export async function assertGrantable(
  patterns: string[] = [],
  request: any,
  grant: Permission = 'panel.users.grant.panel',
  current?: string[],
): Promise<void> {
  if (request?.user?.superuser) return;

  const granted = await grantedPermissions(request);
  const panel = await matchPermission([grant], request);
  const kept = new Set(current || []);

  for (const pattern of patterns) {
    if (kept.has(pattern)) continue;

    if (isDenyPattern(pattern)) continue;

    const target = denyTarget(pattern);

    if (isPlayerPermission(target)) continue;

    if (!panel) throw new ForbiddenException(`Нельзя выдать право «${target}»: нет права выдавать права панели`);

    if (!satisfiesPermission(granted, target)) throw new ForbiddenException(`Нельзя выдать право «${target}»: его нет у вас`);
  }
}

export function actorPriority(actor: User): number | null {
  const own = (actor?.roles || []).filter((role) => !role.important);

  if (!own.length) return null;

  return own.reduce((top, role) => Math.max(top, role.priority ?? 0), Number.NEGATIVE_INFINITY);
}

export function outranksRole(role: Role, actor: User): boolean {
  if (actor?.superuser) return true;

  const priority = actorPriority(actor);

  if (priority === null) return true;

  return (role.priority ?? 0) < priority;
}

export function assertRolePriority(priority: number | null | undefined, actor: User): void {
  if (!actor || actor.superuser) return;

  const own = actorPriority(actor);

  if (own === null) return;

  if ((priority ?? 0) >= own) throw new ForbiddenException('Нельзя задать роли приоритет не ниже вашего');
}

export function assertRoleOutranked(role: Role, actor: User): void {
  if (!outranksRole(role, actor)) throw new ForbiddenException(`Роль «${role.name}» не ниже вас по приоритету`);
}

export async function assertRolesGrantable(next: Role[], current: Role[], actor: User): Promise<void> {
  if (!actor || actor.superuser) return;

  const already = new Set((current || []).map((role) => role.id));

  for (const role of next || []) {
    if (role.important || already.has(role.id)) continue;

    if (!(await roleGrantable(role, actor)))
      throw new ForbiddenException(`Нельзя выдать роль «${role.name}»: её приоритет не ниже вашего или в ней есть лишние права`);
  }
}
