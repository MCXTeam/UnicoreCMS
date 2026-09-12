import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/admin/users/entities/user.entity';
import {
  defaultGrantedPermissions,
  filterPlayerPermissions,
  Permission,
  permissionUniverse,
  resolvePermissionLayers,
  satisfiesPermissions,
} from 'unicore-common';
import _ from 'lodash';
import { DONATE_PERMS_CACHE_KEY, GRANTED_PERMS_CACHE_KEY, PERMISSIONS_KEY } from 'src/common/constants';
import { Role } from '../entities/role.entity';
import { ImportantRoles } from '../enums/important-roles.enum';
import { getDataSourceByName } from 'typeorm-transactional';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';

export type PermissionOptions = {
  or?: boolean;
};

export type PermissionArgs = Permission[] | [Permission[], PermissionOptions];

const SANCTION_ROLES: string[] = [ImportantRoles.Banned];

const isSanction = (role: Role): boolean => SANCTION_ROLES.includes(role.id);

export function roleLayers(roles: Role[] = []): string[][] {
  return [...roles]
    .filter((role) => !isSanction(role))
    .sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0))
    .map((role) => role.perms || []);
}

export function sanctionLayers(roles: Role[] = []): string[][] {
  return (roles || []).filter(isSanction).map((role) => role.perms || []);
}

export function transformPermissions(userPart: Partial<User>, extra: string[] = []) {
  const user = { ...userPart };
  const roles = userPart.roles || [];

  user.perms = resolvePermissionLayers([extra, ...roleLayers(roles), userPart.perms || [], ...sanctionLayers(roles)]);
  user.roles = roles.map((role) => _.omit(role, 'perms')) as Role[];

  if (user.superuser) user.perms = permissionUniverse();

  return user;
}

export function effectivePermissions(userPart: Partial<User>): Partial<User> {
  return transformPermissions(userPart, defaultGrantedPermissions());
}

export async function playerPermissions(request: any): Promise<string[]> {
  if (request[DONATE_PERMS_CACHE_KEY]) return request[DONATE_PERMS_CACHE_KEY];

  const connection = getDataSourceByName('default');
  const [user_dgroups, user_dperms] = await Promise.all([
    connection.getRepository(UsersDonateGroup).find({ where: { user: { uuid: request.user.uuid } }, relations: ['user'] }),
    connection.getRepository(UsersDonatePermission).find({ where: { user: { uuid: request.user.uuid } }, relations: ['user'] }),
  ]);

  const perms = filterPlayerPermissions(
    [user_dperms.map((udp) => udp.permission.web_perms).flat(), user_dgroups.map((udg) => udg.group.web_perms).flat()].flat(),
  );

  request[DONATE_PERMS_CACHE_KEY] = perms;

  return perms;
}

export async function grantedPermissions(request: any): Promise<string[]> {
  const user: User = request.user;

  if (user?.superuser) return permissionUniverse();

  if (request?.[GRANTED_PERMS_CACHE_KEY]) return request[GRANTED_PERMS_CACHE_KEY];

  const granted = resolvePermissionLayers([
    defaultGrantedPermissions(),
    ...roleLayers(user?.roles),
    user?.perms || [],
    await playerPermissions(request),
    ...sanctionLayers(user?.roles),
  ]);

  if (request) request[GRANTED_PERMS_CACHE_KEY] = granted;

  return granted;
}

export async function matchPermission(args: PermissionArgs, request: any): Promise<boolean> {
  const user: User = request.user;

  if (user.superuser) return true;

  const [permissions, options] = (Array.isArray(args[0]) ? args : [args, null]) as [Permission[], PermissionOptions | null];

  return satisfiesPermissions(await grantedPermissions(request), permissions, Boolean(options?.or));
}

export function scopedPermission(permission: Permission, scope?: string | number): Permission {
  return scope ? `${permission}.${scope}` : permission;
}

export async function matchServerPermission(request: any, permission: Permission, serverId?: string | number): Promise<boolean> {
  return matchPermission([scopedPermission(permission, serverId)], request);
}

export async function assertServerPermission(request: any, permission: Permission, serverId?: string | number): Promise<void> {
  if (!(await matchServerPermission(request, permission, serverId))) throw new ForbiddenException();
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<PermissionArgs>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!permissions) return true;

    const request = context.getType() === 'http' ? context.switchToHttp().getRequest() : context.switchToWs().getClient();

    if (!request?.user) return false;

    return matchPermission(permissions, request);
  }
}
