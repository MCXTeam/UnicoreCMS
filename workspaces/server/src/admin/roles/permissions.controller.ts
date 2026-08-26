import { Controller, Get, Req } from '@nestjs/common';
import { Permissions } from './decorators/permission.decorator';
import { PermissionCatalog, PermissionsService } from './permissions.service';
import { RoutePermissions, RoutePermissionsService } from './route-permissions.service';

@Controller('admin/permissions')
export class PermissionsController {
  constructor(private permissions: PermissionsService, private routePermissions: RoutePermissionsService) {}

  @Permissions(['panel.access'])
  @Get('catalog')
  catalog(@Req() request: any): Promise<PermissionCatalog> {
    return this.permissions.catalog(request);
  }

  @Permissions(['panel.roles.read'])
  @Get('routes')
  routes(): RoutePermissions[] {
    return this.routePermissions.routes();
  }
}
