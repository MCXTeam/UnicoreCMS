import { DataSource, EntityManager, In, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { filterPanelPermissions, isDenyPattern } from 'unicore-common';
import { User } from 'src/admin/users/entities/user.entity';
import { Role } from 'src/admin/roles/entities/role.entity';
import { assertGrantable, roleGrantable } from 'src/admin/roles/grant';
import { UsersDonateGroup } from './groups/entities/user-donate.entity';
import { UsersDonatePermission } from './permissions/entities/user-permission.entity';
import { DonateGroup } from './groups/entities/donate-group.entity';
import { DonatePermission } from './permissions/entities/donate-permission.entity';
import { WebRoleOrigin } from './entities/web-role-origin.entity';

class RoleReadQueryBuilder<Entity extends ObjectLiteral> extends SelectQueryBuilder<Entity> {
  protected createLockExpression(): string {
    if (this.expressionMap.lockMode === 'pessimistic_read' && ['mysql', 'mariadb'].includes(this.connection.options.type))
      return ' LOCK IN SHARE MODE';

    return super.createLockExpression();
  }
}

@Injectable()
export class DonateWebRoleService {
  constructor(private readonly dataSource: DataSource) {}

  async resolveWebRole(id?: string | null, request?: any, currentId?: string | null): Promise<Role | null> {
    if (request?.user && currentId && id !== currentId) {
      const previous = await this.dataSource.getRepository(Role).findOneBy({ id: currentId });

      await this.assertGrant(previous, request.user);
    }
    if (!id) return null;

    const role = await this.dataSource.getRepository(Role).findOneBy({ id });

    if (!role) throw new BadRequestException('Веб-роль не найдена');
    if (request?.user && id !== currentId) await this.assertGrant(role, request.user);

    return role;
  }

  private async assertGrant(role: Role | null, actor?: User): Promise<void> {
    if (!role) return;

    if (!actor) {
      if (filterPanelPermissions((role.perms || []).filter((permission) => !isDenyPattern(permission))).length)
        throw new ForbiddenException('Роль с административными правами нельзя получить покупкой или подарком');

      return;
    }

    if (!(await roleGrantable(role, actor))) throw new ForbiddenException('Эту веб-роль выдать нельзя');
    await assertGrantable(role.perms || [], { user: actor });
  }

  async assertGroupGrant(id: number, actor?: User, lock = false): Promise<DonateGroup> {
    const group = await this.dataSource.getRepository(DonateGroup).findOne({ where: { id }, relations: ['web_role'], ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}) });

    if (!group) throw new BadRequestException('Группа не найдена');
    if (!actor && group.purchasable === false) throw new ForbiddenException('Эту группу выдаёт только администратор');
    await this.assertGrant(group.web_role, actor);
    return group;
  }

  async assertPermissionGrant(id: number, actor?: User, lock = false): Promise<DonatePermission> {
    const permission = await this.dataSource.getRepository(DonatePermission).findOne({ where: { id }, relations: ['web_role'], ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}) });

    if (!permission) throw new BadRequestException('Привилегия не найдена');
    if (!actor && permission.purchasable === false) throw new ForbiddenException('Эту привилегию выдаёт только администратор');
    await this.assertGrant(permission.web_role, actor);
    return permission;
  }

  private async activeRoles(manager: EntityManager, uuid: string): Promise<Role[]> {
    const now = new Date();
    const groupsQuery = new RoleReadQueryBuilder<UsersDonateGroup>(manager.getRepository(UsersDonateGroup).createQueryBuilder('granted'))
      .innerJoinAndSelect('granted.group', 'definition').innerJoinAndSelect('definition.web_role', 'role')
      .where('granted.user_uuid = :uuid', { uuid }).andWhere('(granted.expired IS NULL OR granted.expired > :now)', { now })
      .orderBy('granted.id', 'ASC');
    const permissionsQuery = new RoleReadQueryBuilder<UsersDonatePermission>(manager.getRepository(UsersDonatePermission).createQueryBuilder('granted'))
      .innerJoinAndSelect('granted.permission', 'definition').innerJoinAndSelect('definition.web_role', 'role')
      .where('granted.user_uuid = :uuid', { uuid }).andWhere('(granted.expired IS NULL OR granted.expired > :now)', { now })
      .orderBy('granted.id', 'ASC');

    if (manager.queryRunner?.isTransactionActive) {
      groupsQuery.setLock('pessimistic_read');
      permissionsQuery.setLock('pessimistic_read');
    }
    const groups = await groupsQuery.getMany();
    const permissions = await permissionsQuery.getMany();

    return [...new Map([...groups.map((row) => row.group?.web_role), ...permissions.map((row) => row.permission?.web_role)]
      .filter(Boolean).map((role) => [role.id, role])).values()];
  }

  private async inTransaction<T>(action: (manager: EntityManager) => Promise<T>): Promise<T> {
    const manager = this.dataSource.manager;

    return manager.queryRunner?.isTransactionActive ? action(manager) : this.dataSource.transaction(action);
  }

  async syncUser(uuid: string, manualIds?: string[]): Promise<Role[]> {
    return this.inTransaction((manager) => this.syncWithManager(manager, uuid, manualIds));
  }

  private async syncWithManager(manager: EntityManager, uuid: string, manualIds?: string[]): Promise<Role[]> {
    const user = await manager.getRepository(User).createQueryBuilder('user')
      .where('user.uuid = :uuid', { uuid }).setLock('pessimistic_write').getOne();

    if (!user) return [];

    const stored = await new RoleReadQueryBuilder<Role>(manager.getRepository(Role).createQueryBuilder('role'))
      .innerJoin('unicore_users_roles', 'assigned', 'assigned.role_id = role.id')
      .where('assigned.user_uuid = :uuid', { uuid }).orderBy('role.id', 'ASC').setLock('pessimistic_read').getMany();
    const repository = manager.getRepository(WebRoleOrigin);
    const origins = await repository.createQueryBuilder('origin').where('origin.user_uuid = :uuid', { uuid })
      .orderBy('origin.role_id', 'ASC').setLock('pessimistic_write').getMany();
    const active = await this.activeRoles(manager, uuid);
    const byId = new Map(origins.map((origin) => [origin.roleId, origin]));

    for (const role of active) {
      if (byId.has(role.id)) continue;

      const origin = repository.create({ userUuid: uuid, roleId: role.id, manual: stored.some((item) => item.id === role.id), legacy: false });

      origins.push(origin);
      byId.set(role.id, origin);
    }

    if (manualIds !== undefined)
      for (const origin of origins) {
        origin.manual = manualIds.includes(origin.roleId);
        origin.legacy = false;
      }

    if (origins.length) await repository.save(origins);

    const manual = manualIds === undefined
      ? stored.filter((role) => !byId.has(role.id) || byId.get(role.id).manual)
      : await manager.getRepository(Role).findBy({ id: In(manualIds) });
    const roles = [...new Map([...manual, ...active].map((role) => [role.id, role])).values()];
    const before = new Set(stored.map((role) => role.id));
    const after = new Set(roles.map((role) => role.id));
    const added = [...after].filter((id) => !before.has(id));
    const removed = [...before].filter((id) => !after.has(id));

    if (added.length || removed.length)
      await manager.createQueryBuilder().relation(User, 'roles').of(uuid).addAndRemove(added, removed);

    return roles;
  }

  async describe(uuid: string, roles: Role[]) {
    const origins = await this.dataSource.getRepository(WebRoleOrigin).findBy({ userUuid: uuid });
    const automatic = new Set(origins.filter((origin) => !origin.manual).map((origin) => origin.roleId));
    const active = await this.activeRoles(this.dataSource.manager, uuid);

    return {
      manual_roles: roles.filter((role) => !automatic.has(role.id)).map((role) => role.id),
      donate_roles: active.map((role) => ({ id: role.id, name: role.name })),
      legacy_roles: origins.filter((origin) => origin.legacy).map((origin) => origin.roleId),
    };
  }

  async syncGroup(id: number): Promise<void> {
    const rows = await this.dataSource.getRepository(UsersDonateGroup).find({ where: { group: { id } }, relations: ['user'] });

    await this.syncUsers(rows.map((row) => row.user.uuid));
  }

  async syncPermission(id: number): Promise<void> {
    const rows = await this.dataSource.getRepository(UsersDonatePermission).find({ where: { permission: { id } }, relations: ['user'] });

    await this.syncUsers(rows.map((row) => row.user.uuid));
  }

  async affectedUsers(kind: 'group' | 'permission', ids: number[]): Promise<string[]> {
    const rows = kind === 'group'
      ? await this.dataSource.getRepository(UsersDonateGroup).find({ where: { group: { id: In(ids) } }, relations: ['user'] })
      : await this.dataSource.getRepository(UsersDonatePermission).find({ where: { permission: { id: In(ids) } }, relations: ['user'] });

    return [...new Set(rows.map((row) => row.user.uuid))].sort();
  }

  async lockUsers(uuids: string[]): Promise<void> {
    for (const uuid of [...new Set(uuids)].sort())
      await this.dataSource.manager.getRepository(User).createQueryBuilder('user')
        .where('user.uuid = :uuid', { uuid }).setLock('pessimistic_write').getOne();
  }

  async syncUsers(uuids: string[]): Promise<void> {
    for (const uuid of [...new Set(uuids)].sort()) await this.syncUser(uuid);
  }

  private async expire(kind: 'group' | 'permission', id: number, cutoff: Date) {
    return this.inTransaction(async (manager) => {
      const target = kind === 'group' ? UsersDonateGroup : UsersDonatePermission;
      const repository = manager.getRepository<ObjectLiteral>(target);
      const candidate = await repository.findOne({ where: { id }, relations: ['user'] });

      if (!candidate?.user) return null;

      await manager.getRepository(User).createQueryBuilder('user')
        .where('user.uuid = :uuid', { uuid: candidate.user.uuid }).setLock('pessimistic_write').getOne();
      const current = await repository.findOne({ where: { id }, relations: ['user', kind], lock: { mode: 'pessimistic_write' } });

      if (!current?.expired || current.expired > cutoff) return null;

      await repository.remove(current);
      await this.syncWithManager(manager, current.user.uuid);
      return current;
    });
  }

  async expireGroup(id: number, cutoff: Date): Promise<UsersDonateGroup | null> {
    return this.expire('group', id, cutoff) as Promise<UsersDonateGroup | null>;
  }

  async expirePermission(id: number, cutoff: Date): Promise<UsersDonatePermission | null> {
    return this.expire('permission', id, cutoff) as Promise<UsersDonatePermission | null>;
  }

  async grantForGroup(uuid: string, _id: number): Promise<void> { await this.syncUser(uuid); }
  async grantForPermission(uuid: string, _id: number): Promise<void> { await this.syncUser(uuid); }
  async revokeGroupRole(uuid: string, _id: number): Promise<void> { if (uuid) await this.syncUser(uuid); }
  async revokePermissionRole(uuid: string, _id: number): Promise<void> { if (uuid) await this.syncUser(uuid); }
}
