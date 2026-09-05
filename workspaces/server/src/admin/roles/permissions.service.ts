import { Injectable } from '@nestjs/common';
import { isPlayerPermission, PermissionEntry, permissionEntries, satisfiesPermission } from 'unicore-common';
import { ServersService } from 'src/game/servers/servers.service';
import { grantedPermissions, matchPermission } from './guards/permisson.guard';

export interface PermissionScopeOption {
  id: string;
  name: string;
}

export interface PermissionCatalog {
  permissions: PermissionEntry[];
  servers: PermissionScopeOption[];
}

@Injectable()
export class PermissionsService {
  constructor(private serversService: ServersService) {}

  async grantable(request: any): Promise<PermissionEntry[]> {
    const superuser = Boolean(request?.user?.superuser);
    const granted = await grantedPermissions(request);
    const panel =
      superuser || (await matchPermission([['panel.users.grant.panel', 'panel.roles.grant.panel'], { or: true }], request));

    return permissionEntries().filter((entry) => {
      if (!panel && !isPlayerPermission(entry.key)) return false;

      return superuser || satisfiesPermission(granted, entry.key);
    });
  }

  async catalog(request: any): Promise<PermissionCatalog> {
    const [permissions, servers] = await Promise.all([this.grantable(request), this.serversService.find()]);

    return {
      permissions,
      servers: servers.map((server) => ({ id: server.id, name: server.name })),
    };
  }
}
