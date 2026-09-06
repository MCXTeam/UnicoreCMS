import { ForbiddenException } from '@nestjs/common';
import { denyTarget, isDenyPattern, Permission, satisfiesPermission } from 'unicore-common';
import { grantedPermissions, matchPermission } from './guards/permisson.guard';

const GLOBAL_DENIED = 'Запись не привязана к серверам, нужно право управлять такими записями';

export async function allowedServers(request: any, permission: Permission): Promise<string[] | null> {
  if (!request?.user) return null;
  if (request.user.superuser) return null;

  const granted = await grantedPermissions(request);

  if (satisfiesPermission(granted, permission)) return null;

  const prefix = `${permission}.`;
  const denied = granted.filter(isDenyPattern).map(denyTarget);
  const servers = granted
    .filter((pattern) => !isDenyPattern(pattern) && pattern.startsWith(prefix) && !pattern.includes('*'))
    .filter((pattern) => !denied.includes(pattern))
    .map((pattern) => pattern.slice(prefix.length));

  return Array.from(new Set(servers));
}

export async function allowedServersAny(request: any, permissions: Permission[]): Promise<string[] | null> {
  const scopes = await Promise.all(permissions.map((permission) => allowedServers(request, permission)));

  if (scopes.some((scope) => scope === null)) return null;

  return Array.from(new Set(scopes.flat() as string[]));
}

export async function assertServerScope(request: any, permission: Permission, servers: string[] = []): Promise<void> {
  const allowed = await allowedServers(request, permission);

  if (!allowed) return;

  const outside = servers.filter((id) => !allowed.includes(id));

  if (outside.length) throw new ForbiddenException(`Нет доступа к серверу «${outside[0]}»`);
}

export async function assertServerList(
  request: any,
  permission: Permission,
  next: string[] = [],
  current?: string[],
): Promise<void> {
  const allowed = await allowedServers(request, permission);

  if (!allowed) return;

  const before = current ?? next;

  if (!before.some((id) => allowed.includes(id))) throw new ForbiddenException('Запись не относится к вашим серверам');

  const changed = [...next.filter((id) => !(current ?? []).includes(id)), ...(current ?? []).filter((id) => !next.includes(id))];
  const outside = changed.filter((id) => !allowed.includes(id));

  if (outside.length) throw new ForbiddenException(`Нельзя менять привязку к серверу «${outside[0]}»`);
}

export async function assertServerEntities(
  request: any,
  permission: Permission,
  entities: { servers?: { id: string }[] }[],
): Promise<void> {
  const allowed = await allowedServers(request, permission);

  if (!allowed) return;

  for (const entity of entities) {
    const servers = (entity.servers || []).map((server) => server.id);

    if (!servers.some((id) => allowed.includes(id))) throw new ForbiddenException('Запись не относится к вашим серверам');
  }
}

async function assertGlobalScope(request: any, global: Permission): Promise<void> {
  if (!(await matchPermission([global], request))) throw new ForbiddenException(GLOBAL_DENIED);
}

export async function assertServerListOrGlobal(
  request: any,
  permission: Permission,
  global: Permission,
  next: string[] = [],
  current?: string[],
): Promise<void> {
  const attached = current !== undefined && current.length > 0;
  const wasGlobal = current !== undefined && !attached;
  const willBeGlobal = !next.length;

  if (wasGlobal || willBeGlobal) await assertGlobalScope(request, global);

  if (willBeGlobal && !attached) return;

  await assertServerList(request, permission, next, attached ? current : undefined);
}

export async function assertServerEntitiesOrGlobal(
  request: any,
  permission: Permission,
  global: Permission,
  entities: { servers?: { id: string }[] }[],
): Promise<void> {
  const isGlobal = (entity: { servers?: { id: string }[] }) => !(entity.servers || []).length;

  if (entities.some(isGlobal)) await assertGlobalScope(request, global);

  await assertServerEntities(
    request,
    permission,
    entities.filter((entity) => !isGlobal(entity)),
  );
}
