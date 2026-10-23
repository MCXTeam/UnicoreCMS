import { Injectable } from '@nestjs/common';
import { isPlayerPermission, PermissionCatalogEntry, permissionEntries, satisfiesPermission } from 'unicore-common';
import { ServersService } from 'src/game/servers/servers.service';
import { grantedPermissions, matchPermission } from './guards/permisson.guard';
import { DataSource } from 'typeorm';
import { PunishmentGroup } from 'src/game/punishments/entities/punishment-group.entity';
import { ConnectInstance } from 'src/game/connect/entities/connect-instance.entity';

export interface PermissionScopeOption {
  id: string;
  name: string;
  labelKey?: string;
}

export interface PermissionCatalog {
  permissions: PermissionCatalogEntry[];
  servers: PermissionScopeOption[];
  punishments: PermissionScopeOption[];
}

@Injectable()
export class PermissionsService {
  constructor(private serversService: ServersService, private dataSource: DataSource) {}

  async grantable(request: any): Promise<PermissionCatalogEntry[]> {
    const superuser = Boolean(request?.user?.superuser);
    const granted = await grantedPermissions(request);
    const panel =
      superuser || (await matchPermission([['panel.users.grant.panel', 'panel.roles.grant.panel'], { or: true }], request));

    return permissionEntries()
      .filter((entry) => panel || isPlayerPermission(entry.key))
      .map((entry) => ({
        ...entry,
        grantable: superuser || isPlayerPermission(entry.key) || satisfiesPermission(granted, entry.key),
      }));
  }

  async catalog(request: any): Promise<PermissionCatalog> {
    const [permissions, servers] = await Promise.all([this.grantable(request), this.serversService.find()]);
    const [groups, instances] = await Promise.all([this.dataSource.getRepository(PunishmentGroup).find(), this.dataSource.getRepository(ConnectInstance).findBy({ retired: false })]);

    return {
      permissions,
      servers: servers.map((server) => ({ id: server.id, name: server.name })),
      punishments: [
        { id: 'project', name: '', labelKey: 'punishments.project_scope' },
        { id: 'account', name: '', labelKey: 'punishments.account_scope' },
        ...groups.map((group) => ({ id: `group:${group.id}`, name: group.name })),
        ...servers.map((server) => ({ id: `server:${server.id}`, name: server.name })),
        ...instances.map((instance) => ({ id: `instance:${instance.id}`, name: instance.displayName || `${servers.find((server) => server.id === instance.serverId)?.name || instance.serverId} · ${instance.instanceId.slice(0,8)}` })),
      ],
    };
  }
}
