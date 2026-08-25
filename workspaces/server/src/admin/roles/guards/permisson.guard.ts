import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/admin/users/entities/user.entity';
import {
  anyServerPermission,
  filterDonateWebPerms,
  Permission,
  permissionMatches,
  resolvePermissions,
  SERVER_PERMISSION_PLACEHOLDER,
} from 'unicore-common';
import * as _ from 'lodash';
import { DONATE_PERMS_CACHE_KEY, PERMISSIONS_KEY } from 'src/common/constants';
import { Role } from '../entities/role.entity';
import { Repository } from 'typeorm';
import { getDataSourceByName } from 'typeorm-transactional';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { permissionUniverse } from '../permission-universe';

export type PermissionOptions = {
  or?: boolean;
};
export type PermissionArgs = (Permission | string)[] | [(Permission | string)[], PermissionOptions]; // Or condition

export function satisfiesPermission(granted: string[], required: string): string[] {
  const direct = resolvePermissions(granted, [required]);

  if (direct.length || !required.includes('*')) return direct;

  const denied = granted.filter((pattern) => pattern.charAt(0) === '!').map((pattern) => pattern.slice(1));
  const covered = granted
    .filter((pattern) => pattern.charAt(0) !== '!')
    .some((pattern) => permissionMatches(pattern, required) && !denied.some((deny) => permissionMatches(pattern, deny)));

  return covered ? [required] : [];
}

function serverScopedPermissions(patterns: string[]): string[] {
  const templates = permissionUniverse()
    .filter((permission) => permission.includes(SERVER_PERMISSION_PLACEHOLDER))
    .map((permission) => anyServerPermission(permission));

  return patterns.filter(
    (pattern) => pattern.charAt(0) !== '!' && !pattern.includes('*') && templates.some((template) => permissionMatches(pattern, template)),
  );
}

export function transformPermissions(userPart: Partial<User>) {
  const user = { ...userPart };
  if (!user?.perms) user.perms = [];
  if (!user?.roles) user.roles = [];
  user.perms.push(...user.roles.map((role) => role.perms).flat());

  if (user.perms.length) user.perms = _.union(resolvePermissions(user.perms, permissionUniverse()), serverScopedPermissions(user.perms));

  user.roles = user.roles.map((role) => _.omit(role, 'perms')) as Role[];

  if (user.superuser) user.perms = permissionUniverse();

  return user;
}

async function donateWebPerms(request: any): Promise<string[]> {
  if (request[DONATE_PERMS_CACHE_KEY]) return request[DONATE_PERMS_CACHE_KEY];

  const connection = getDataSourceByName('default');
  const [user_dgroups, user_dperms] = await Promise.all([
    connection.getRepository(UsersDonateGroup).find({ where: { user: { uuid: request.user.uuid } }, relations: ['user'] }),
    connection.getRepository(UsersDonatePermission).find({ where: { user: { uuid: request.user.uuid } }, relations: ['user'] }),
  ]);

  const perms = filterDonateWebPerms(
    [user_dperms.map((udp) => udp.permission.web_perms).flat(), user_dgroups.map((udg) => udg.group.web_perms).flat()].flat(),
  );

  request[DONATE_PERMS_CACHE_KEY] = perms;

  return perms;
}

export async function matchPermission(args: PermissionArgs, request: any): Promise<boolean> {
  const user: User = request.user;

  // Первым делом проверяем пользователя на SuperUser aka root
  if (user.superuser) {
    return true;
  }

  const add_perms = await donateWebPerms(request);

  var permissions: string[] = new Array();
  var options: PermissionOptions = null;

  if (Array.isArray(args[0])) {
    permissions = args[0];
    options = args[1] as PermissionOptions;
  } else {
    permissions = args as Permission[];
  }

  const granted = [...(user.roles || []).map((role) => role.perms || []).flat(), ...(user.perms || []), ...(add_perms || [])];
  const satisfied = permissions.filter((permission) => satisfiesPermission(granted, permission).length > 0);

  // Подводим итог
  // OR или AND
  if (options && options.or) {
    return satisfied.length > 0;
  } else {
    return permissions.length === satisfied.length;
  }
}

export async function matchServerPermission(request: any, permission: Permission, serverId?: string): Promise<boolean> {
  const permissions = [permission];

  if (serverId) permissions.push(`${permission}.${serverId}` as Permission);

  return matchPermission([permissions, { or: true }], request);
}

export async function assertServerPermission(request: any, permission: Permission, serverId?: string): Promise<void> {
  if (!(await matchServerPermission(request, permission, serverId))) throw new ForbiddenException();
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<PermissionArgs>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!permissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      return false;
    }

    return matchPermission(permissions, request);
  }
}
