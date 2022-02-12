import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/admin/users/entities/user.entity';
import { Permission } from 'unicore-common';
import * as minimath from 'minimatch';
import * as _ from 'lodash';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';

export type PermissionOptions = {
  handle?: (req: any) => Record<string, string | number | boolean> | Promise<Record<string, string | number | boolean>>;
  or?: boolean;
};
export type PermissionArgs = Permission[] | [Permission[], PermissionOptions]; // Or condition

export function matchPermission(args: PermissionArgs, request: any): boolean {
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

  if (user.roles && user.roles.length) {
    // Сортируем по приоритету
    user.roles = _.sortBy(user.roles, 'priority');

    // Проходимся по ролям
    for (const role of user.roles) {
      if (role.perms && role.perms.length) {
        // Проходимся по правам роли
        for (const perm of role.perms) {
          // Проверям наличие права по паттерну
          matched = _.union(matched, minimath.match(permissions, perm));

          // !Исключения (exclude) всегда в приоритете...
          // Они же права (патерны) начинающиеся на "!"
          // Фильтруем их, а потом удаляем "мусор"
          if (perm.charAt(0) === '!') matched = _.pull(matched, ...minimath.match(permissions, perm.slice(1)));
        }
      }
    }
  }

  // Проверяем уникальные права пользователя (логика работы идентична, но приоритет всегда выше)
  if (user.perms && user.perms.length) {
    // Проходимся по правам пользователя
    for (const perm of user.perms) {
      matched = _.union(matched, minimath.match(permissions, perm));

      if (perm.charAt(0) === '!') {
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
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<PermissionArgs>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!permissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    return matchPermission(permissions, request);
  }
}
