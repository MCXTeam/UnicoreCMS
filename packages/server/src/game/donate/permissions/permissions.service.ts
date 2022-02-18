import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { Period } from '../entities/period.entity';
import { GroupKit } from '../groups/entities/group-kit.entity';
import { PermissionInput } from './dto/permission.input';
import { DonatePermission } from './entities/donate-permission.entity';
import { PermissionType } from './enums/permission-type.enum';

@Injectable()
export class DonatePermissionsService {
  constructor(
    @InjectRepository(DonatePermission)
    private donatePermissionsRepository: Repository<DonatePermission>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Period)
    private periodsRepository: Repository<Period>,
    @InjectRepository(GroupKit)
    private groupKitsRepository: Repository<GroupKit>,
  ) {}

  find(relations: string[] = new Array()): Promise<DonatePermission[]> {
    return this.donatePermissionsRepository.find({ relations });
  }

  findOne(id: number, relations?: string[]): Promise<DonatePermission> {
    return this.donatePermissionsRepository.findOne(id, { relations });
  }

  async create(input: PermissionInput) {
    const perm = new DonatePermission();

    perm.name = input.name;
    perm.type = input.type;
    perm.description = input.description;
    perm.price = input.price;
    perm.sale = input.sale;

    perm.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    perm.perms = [];
    perm.servers = [];
    perm.web_perms = [];
    perm.kits = [];
    perm.servers = [];

    switch (input.type) {
      case PermissionType.Game:
        perm.perms = input.perms;
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.find({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
    }

    return this.donatePermissionsRepository.save(perm);
  }

  async update(id: number, input: PermissionInput) {
    const perm = await this.findOne(id);

    if (!perm) {
      throw new NotFoundException();
    }

    perm.name = input.name;
    perm.description = input.description;
    perm.price = input.price;
    perm.sale = input.sale;

    perm.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    perm.perms = [];
    perm.servers = [];
    perm.web_perms = [];
    perm.kits = [];
    perm.servers = [];

    switch (input.type) {
      case PermissionType.Game:
        perm.perms = input.perms;
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.find({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
    }

    return this.donatePermissionsRepository.save(perm);
  }

  async remove(id: number) {
    const perm = await this.findOne(id);

    if (!perm) {
      throw new NotFoundException();
    }

    return this.donatePermissionsRepository.remove(perm);
  }

  async removeMany(ids: number[]) {
    const perms = await this.donatePermissionsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.donatePermissionsRepository.remove(perms);
  }
}
