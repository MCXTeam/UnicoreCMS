import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StorageManager } from '@common';
import { RoleBadgeEffect } from 'unicore-common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { RoleUpdateInput } from './dto/role-update.input';
import { RoleCreateInput } from './dto/role-create.input';
import { User } from '../users/entities/user.entity';
import { ImportantRoles } from './emums/important-roles.enum';
import { assertGrantable } from './grant';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  /**
   * Генерация корневых ролей
   */
  async importantRoles(): Promise<void> {
    await this.rolesRepository
      .createQueryBuilder()
      .insert()
      .into(Role)
      .values([
        {
          id: ImportantRoles.Default,
          name: 'Игрок',
          perms: ['player.*', '!player.skin.hd', '!player.cloak.hd'],
          important: true,
          priority: 0,
        },
        {
          id: ImportantRoles.Banned,
          name: 'Заблокированный',
          perms: ['!player.transfer'],
          important: true,
          priority: 5,
        },
      ])
      .orIgnore()
      .execute();
  }

  find(): Promise<Role[]> {
    return this.rolesRepository.find({
      order: {
        important: 'DESC',
        priority: 'DESC',
      },
    });
  }

  findOne(id: string): Promise<Role> {
    return this.rolesRepository.findOneBy({ id });
  }

  private applyAppearance(role: Role, input: RoleUpdateInput): void {
    role.color = input.color ?? null;
    role.staff = Boolean(input.staff);
    role.badge = !!input.badge;
    role.badge_color = input.badge_color ?? null;
    role.badge_background = input.badge_background ?? null;
    role.badge_background_end = input.badge_background_end ?? null;
    role.badge_effect = input.badge_effect ?? RoleBadgeEffect.None;
  }

  async create(input: RoleCreateInput, request?: any): Promise<Role> {
    if (await this.findOne(input.id)) {
      throw new ConflictException();
    }

    await assertGrantable(input.perms, request);

    const role = new Role();

    role.id = input.id;
    role.name = input.name;
    role.perms = input.perms;
    role.priority = input.priority;
    role.referal_percent = input.referal_percent ?? null;
    this.applyAppearance(role, input);

    return this.rolesRepository.save(role);
  }

  async update(id: string, input: RoleUpdateInput, request?: any): Promise<Role> {
    const role = await this.findOne(id);

    if (!role) {
      throw new NotFoundException();
    }

    await assertGrantable(input.perms, request);

    role.name = input.name;
    role.perms = input.perms;
    role.priority = input.priority;
    role.referal_percent = input.referal_percent ?? null;
    this.applyAppearance(role, input);

    return this.rolesRepository.save(role);
  }

  async remove(id: string): Promise<Role> {
    const role = await this.findOne(id);

    if (!role) {
      throw new NotFoundException();
    }

    return this.rolesRepository.remove(role);
  }

  async updateBadgeImage(id: string, file: Express.Multer.File): Promise<Role> {
    const role = await this.findOne(id);

    if (!role) {
      StorageManager.remove(file.filename);
      throw new NotFoundException();
    }

    StorageManager.remove(role.badge_image);
    role.badge_image = file.filename;

    return this.rolesRepository.save(role);
  }

  async removeBadgeImage(id: string): Promise<Role> {
    const role = await this.findOne(id);

    if (!role) {
      throw new NotFoundException();
    }

    StorageManager.remove(role.badge_image);
    role.badge_image = null;

    return this.rolesRepository.save(role);
  }
}
