import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperUserGuard } from './guards/superuser.guard';
import { RoutePermissions, RoutePermissionsService } from './route-permissions.service';

@UseGuards(SuperUserGuard)
@Controller('admin/permissions')
export class RoutePermissionsController {
  constructor(private routePermissions: RoutePermissionsService) {}

  @Get('routes')
  routes(): RoutePermissions[] {
    return this.routePermissions.routes();
  }
}
