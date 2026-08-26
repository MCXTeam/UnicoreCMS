import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD, DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersModule } from 'src/game/servers/servers.module';
import { Role } from './entities/role.entity';
import { PermissionGuard } from './guards/permisson.guard';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { RoutePermissionsService } from './route-permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role]), ServersModule, DiscoveryModule],
  providers: [
    RolesService,
    PermissionsService,
    RoutePermissionsService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  controllers: [RolesController, PermissionsController],
})
export class RolesModule implements OnModuleInit {
  constructor(private rolesService: RolesService) {}

  async onModuleInit() {
    await this.rolesService.importantRoles();
  }
}
