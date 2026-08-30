import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { Role } from 'src/admin/roles/entities/role.entity';
import { UsersDonateGroup } from './groups/entities/user-donate.entity';
import { UsersDonatePermission } from './permissions/entities/user-permission.entity';
import { DonateGroup } from './groups/entities/donate-group.entity';
import { DonatePermission } from './permissions/entities/donate-permission.entity';

@Injectable()
export class DonateWebRoleService {
  constructor(private readonly dataSource: DataSource) {}

  async resolveWebRole(id?: string | null): Promise<Role | null> {
    if (!id) return null;

    return (await this.dataSource.getRepository(Role).findOneBy({ id })) ?? null;
  }

  async grantForGroup(userUuid: string, groupId: number): Promise<void> {
    const group = await this.dataSource.getRepository(DonateGroup).findOne({ where: { id: groupId }, relations: ['web_role'] });

    if (group?.web_role) await this.grant(userUuid, group.web_role);
  }

  async grantForPermission(userUuid: string, permissionId: number): Promise<void> {
    const permission = await this.dataSource
      .getRepository(DonatePermission)
      .findOne({ where: { id: permissionId }, relations: ['web_role'] });

    if (permission?.web_role) await this.grant(userUuid, permission.web_role);
  }

  async revokeGroupRole(userUuid: string, groupId: number): Promise<void> {
    const group = await this.dataSource.getRepository(DonateGroup).findOne({ where: { id: groupId }, relations: ['web_role'] });

    if (!group?.web_role) return;

    await this.revokeIfUnused(userUuid, group.web_role);
  }

  async revokePermissionRole(userUuid: string, permissionId: number): Promise<void> {
    const permission = await this.dataSource
      .getRepository(DonatePermission)
      .findOne({ where: { id: permissionId }, relations: ['web_role'] });

    if (!permission?.web_role) return;

    await this.revokeIfUnused(userUuid, permission.web_role);
  }

  private async grant(userUuid: string, role: Role): Promise<void> {
    const users = this.dataSource.getRepository(User);
    const user = await users.findOne({ where: { uuid: userUuid }, relations: ['roles'] });

    if (!user || user.roles?.some((item) => item.id === role.id)) return;

    user.roles = [...(user.roles || []), role];

    await users.save(user);
  }

  private async revokeIfUnused(userUuid: string, role: Role): Promise<void> {
    const users = this.dataSource.getRepository(User);
    const user = await users.findOne({ where: { uuid: userUuid }, relations: ['roles'] });

    if (!user?.roles?.some((item) => item.id === role.id)) return;

    user.roles = user.roles.filter((item) => item.id !== role.id);

    await users.save(user);
  }
}
