import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/admin/users/entities/user.entity';
import { Permission } from 'unicore-common';
import * as minimath from 'minimatch';
import * as _ from 'lodash';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';
import { Role } from '../entities/role.entity';
import { getConnection, Repository } from 'typeorm';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { InjectRepository } from '@nestjs/typeorm';

export type PermissionOptions = {
  handle?: (req: any) => Record<string, string | number | boolean> | Promise<Record<string, string | number | boolean>>;
  or?: boolean;
};
export type PermissionArgs = Permission[] | [Permission[], PermissionOptions]; // Or condition

export function transformPermissions(userPart: Partial<User>) {
  const user = { ...userPart };
  if (!user?.perms) user.perms = [];
  if (!user?.roles) user.roles = [];

  if (user.perms.length) {
    // Проходимся по правам пользователя
    const exclude = user.perms
      .filter((perm) => perm.charAt(0) === '!')
      .map((perm) => minimath.match(Object.values(Permission), perm.slice(1)))
      .flat();
    user.perms = _.union(
      _.pull(
        user.perms
          .filter((perm) => perm.charAt(0) !== '!')
          .map((perm) => minimath.match(Object.values(Permission), perm))
          .flat(),
        ...exclude,
      ),
    );
  }

  user.roles = user.roles.map((role) => _.omit(role, 'perms')) as Role[];

  if (user.superuser) user.perms = Object.values(Permission);

  return user;
}

export async function matchPermission(args: PermissionArgs, request: any): Promise<boolean> {
  const connection = getConnection()
  const user_dgroups = await connection.getRepository(UsersDonateGroup).find({ where: { user: request.user }, relations: ['user'] })
  const user_dperms = await connection.getRepository(UsersDonatePermission).find({ where: { user: request.user }, relations: ['user'] })
  const add_perms = [user_dperms.map(udp => udp.permission.web_perms).flat(), user_dgroups.map(udg => udg.group.web_perms).flat()].flat()
  const user: User = request.user;

  // Первым делом проверяем пользователя на SuperUser aka root
  if (user.superuser) {
    return true;
  }

  var matched: string[] = new Array();
  var permissions: string[] = new Array();
  var options: PermissionOptions = null;

  if (Array.isArray(args[0])) {
    permissions = args[0];
    options = args[1] as PermissionOptions;
  } else {
    permissions = args as Permission[];
  }

  // Каките кустом параметры
  if (options && options.handle) {
    // Заполняем %...% переменными
    // Например server => hitech (id) из handle
    permissions = _.uniq(
      permissions.map((permission) => {
        const handleObj = options.handle(request);
        // Проходимся по предоставленным параметрам (ибо вдруг их несколько)
        for (const handle in handleObj) {
          permission = permission.replace(`%${handle}%`, handleObj[handle]);
        }

        return permission;
      }),
    );
  }

  if (user.roles) {
    // Сортируем по приоритету
    user.roles = _.sortBy(user.roles, 'priority');

    // Проходимся по ролям
    for (const role of user.roles) {
      if (role.perms && role.perms.length) {
        // Проходимся по правам роли
        for (const perm of role.perms) {
          // Проверям наличие права по паттерну
          if (perm.charAt(0) !== '!') {
            matched = _.union(matched, minimath.match(permissions, perm));
          } else {
            // !Исключения (exclude) всегда в приоритете...
            // Они же права (патерны) начинающиеся на "!"
            // Фильтруем их, а потом удаляем "мусор"
            matched = _.pull(matched, ...minimath.match(permissions, perm.slice(1)));
          }
        }
      }
    }
  }

  // Проверяем уникальные права пользователя (логика работы идентична, но приоритет всегда выше)
  if (user.perms && user.perms.length) {
    // Проходимся по правам пользователя
    for (const perm of user.perms) {
      if (perm.charAt(0) !== '!') {
        matched = _.union(matched, minimath.match(permissions, perm));
      } else {
        matched = _.pull(matched, ...minimath.match(permissions, perm.slice(1)));
      }
    }
  }

  // Накладные права групп и прав (донат)
  if (add_perms && add_perms.length) {
    // Проходимся по правам пользователя
    for (const perm of add_perms) {
      if (perm.charAt(0) !== '!') {
        matched = _.union(matched, minimath.match(permissions, perm));
      } else {
        matched = _.pull(matched, ...minimath.match(permissions, perm.slice(1)));
      }
    }
  }

  // Подводим итог
  // OR или AND
  if (options && options.or) {
    return matched.length > 0;
  } else {
    return permissions.length === matched.length;
  }
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

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
