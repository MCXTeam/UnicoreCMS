import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Permission, EventPermission } from 'unicore-common';
import { uniq } from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { RoleUpdateInput } from './dto/role-update.input';
import { RoleCreateInput } from './dto/role-create.input';
import { User } from '../users/entities/user.entity';
import { ServersService } from 'src/game/servers/servers.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private serversService: ServersService
  ) { }

  /**
   * Генерация корневых ролей
   */
  async importantRoles(): Promise<void> {
    await this.rolesRepository.createQueryBuilder()
      .insert()
      .into(Role)
      .values([
        { id: "user", name: "User", perms: ['user.*'], important: true },
        { id: "admin", name: "Admin", perms: ['*'], important: true, priority: 10 }
      ])
      .orIgnore()
      .execute();
  }

  async findAutoCompleate(): Promise<string[]> {
    const servers = await this.serversService.find()

    var autocompleate = uniq(
      Object.values({...Permission, ...EventPermission})
        .map((perm) => {
          const perm_map = perm.split('.').map((part, index, perm_split) => {
            return [
              perm_split.map(
                (v, i, o) => perm_split.slice(0, -i).join('.') + '.*',
              ),
              perm_split.join('.'),
            ];
          });
          return perm_map;
        })
        .flat(3).sort(),
    ).filter((perm) => perm !== '.*')

    autocompleate = autocompleate.map((perm: any) => {
      if (perm.includes('%server%')) {
        perm = servers.map(server => perm.replace('%server%', server.id))
      }

      return perm
    })

    return uniq(autocompleate.flat(2)).sort()
  }

  async me(user: User) {
    if (user.superuser) return Object.values(Permission)

    
  }

  find(): Promise<Role[]> {
    return this.rolesRepository.find({
      order: {
        important: 'DESC',
        priority: 'DESC'
      }
    })
  }

  findOne(id: string): Promise<Role> {
    return this.rolesRepository.findOne(id)
  }

  async create(input: RoleCreateInput): Promise<Role> {
    if (await this.findOne(input.id)) {
      throw new ConflictException()
    }

    const role = new Role()

    role.id = input.id
    role.name = input.name
    role.perms = input.perms
    role.priority = input.priority

    return this.rolesRepository.save(role)
  }

  async update(id: string, input: RoleUpdateInput): Promise<Role> {
    const role = await this.findOne(id)

    if (!role) {
      throw new NotFoundException()
    }

    role.name = input.name
    role.perms = input.perms
    role.priority = input.priority

    return this.rolesRepository.save(role)
  }

  async remove(id: string): Promise<Role> {
    const role = await this.findOne(id)

    if (!role) {
      throw new NotFoundException()
    }

    return this.rolesRepository.remove(role)
  }
}
