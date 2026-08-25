import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, RUNTIME_PERMISSIONS_KEY } from 'src/common/constants';
import { PermissionArgs, PermissionOptions } from './guards/permisson.guard';

export interface RoutePermissions {
  method: string;
  path: string;
  controller: string;
  handler: string;
  permissions: string[];
  any: boolean;
  public: boolean;
  superuser: boolean;
  runtime: boolean;
}

function joinPath(...parts: string[]): string {
  const path = parts
    .filter((part) => part && part !== '/')
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

  return `/${path}`;
}

@Injectable()
export class RoutePermissionsService {
  constructor(private discovery: DiscoveryService, private scanner: MetadataScanner, private reflector: Reflector) {}

  routes(): RoutePermissions[] {
    const routes: RoutePermissions[] = [];

    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper;

      if (!instance || !metatype) continue;

      const prototype = Object.getPrototypeOf(instance);
      const controllerPath: string = Reflect.getMetadata(PATH_METADATA, metatype) || '';
      const guards: any[] = Reflect.getMetadata('__guards__', metatype) || [];
      const controllerSuperuser = guards.some((guard) => guard?.name === 'SuperUserGuard');

      for (const handlerName of this.scanner.getAllMethodNames(prototype)) {
        const handler = prototype[handlerName];
        const routePath = Reflect.getMetadata(PATH_METADATA, handler);

        if (routePath === undefined) continue;

        const method: number = Reflect.getMetadata(METHOD_METADATA, handler) ?? RequestMethod.GET;
        const args = this.reflector.getAllAndOverride<PermissionArgs>(PERMISSIONS_KEY, [handler, metatype]);
        const handlerGuards: any[] = Reflect.getMetadata('__guards__', handler) || [];

        let permissions: string[] = [];
        let options: PermissionOptions = null;

        if (Array.isArray(args)) {
          if (Array.isArray(args[0])) {
            permissions = args[0] as string[];
            options = args[1] as PermissionOptions;
          } else {
            permissions = args as string[];
          }
        }

        routes.push({
          method: RequestMethod[method],
          path: joinPath(controllerPath, routePath),
          controller: metatype.name,
          handler: handlerName,
          permissions,
          any: Boolean(options?.or),
          public: Boolean(this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [handler, metatype])),
          runtime: Boolean(this.reflector.getAllAndOverride<boolean>(RUNTIME_PERMISSIONS_KEY, [handler, metatype])),
          superuser: controllerSuperuser || handlerGuards.some((guard) => guard?.name === 'SuperUserGuard'),
        });
      }
    }

    return routes.sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method));
  }
}
