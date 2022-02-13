import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { Period } from '../../entities/period.entity';
import { GroupInput } from '../dto/group.input';
import { DonateGroup } from '../entities/donate-group.entity';
import { GroupKit } from '../entities/group-kit.entity';

@Injectable()
export class DonateGroupsService {
  constructor(
    @InjectRepository(DonateGroup)
    private donateGroupsRepository: Repository<DonateGroup>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Period)
    private periodsRepository: Repository<Period>,
    @InjectRepository(GroupKit)
    private groupKitsRepository: Repository<GroupKit>,
  ) {}

  find(relations: string[] = new Array()): Promise<DonateGroup[]> {
    return this.donateGroupsRepository.find({ relations });
  }

  findOne(id: number, relations?: string[]): Promise<DonateGroup> {
    return this.donateGroupsRepository.findOne(id, { relations });
  }

  async create(input: GroupInput) {
    const group = new DonateGroup();

    group.name = input.name;
    group.description = input.description;
    group.price = input.price;
    group.sale = input.sale;
    group.ingame_id = input.ingame_id;
    group.web_perms = input.web_perms
    group.features = input.features

    group.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    group.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    group.kits = await this.groupKitsRepository.find({
      id: In(input.kits),
    });

    return this.donateGroupsRepository.save(group);
  }

  async update(id: number, input: GroupInput) {
    const group = await this.findOne(id);

    if (!group) {
      throw new NotFoundException();
    }

    group.name = input.name;
    group.description = input.description;
    group.price = input.price;
    group.sale = input.sale;
    group.ingame_id = input.ingame_id;
    group.web_perms = input.web_perms
    group.features = input.features

    group.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    group.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    group.kits = await this.groupKitsRepository.find({
      id: In(input.kits),
    });

    return this.donateGroupsRepository.save(group);
  }

  async remove(id: number) {
    const group = await this.findOne(id);

    if (!group) {
      throw new NotFoundException();
    }

    return this.donateGroupsRepository.remove(group);
  }

  async removeMany(ids: number[]) {
    const groups = await this.donateGroupsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.donateGroupsRepository.remove(groups);
  }

  async updateIcon(id: number, file: MulterFile) {
    const group = await this.findOne(id);

    if (!group) {
      StorageManager.remove(file.fieldname);
      throw new NotFoundException();
    }

    StorageManager.remove(group.icon);
    group.icon = file.filename;

    return this.donateGroupsRepository.save(group);
  }

  async removeIcon(id: number) {
    const group = await this.findOne(id);

    if (!group) {
      throw new NotFoundException();
    }

    StorageManager.remove(group.icon);
    group.icon = null;

    return this.donateGroupsRepository.save(group);
  }
}
