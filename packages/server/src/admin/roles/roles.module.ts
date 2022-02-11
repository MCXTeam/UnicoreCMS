import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersModule } from 'src/game/servers/servers.module';
import { Role } from './entities/role.entity';
import { PermissionGuard } from './guards/permisson.guard';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    ServersModule
  ],
  providers: [
    RolesService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  controllers: [RolesController],
})
export class RolesModule implements OnModuleInit {
  constructor(private rolesService: RolesService) { }

  async onModuleInit() {
    await this.rolesService.importantRoles()
  }
}
