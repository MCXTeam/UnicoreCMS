import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { In, Repository } from 'typeorm';
import { GroupKitInput } from '../dto/group-kit.input';
import { GroupKit } from '../entities/group-kit.entity';

@Injectable()
export class GroupKitsService {
  constructor(
    @InjectRepository(GroupKit)
    private groupKitsRepository: Repository<GroupKit>,
  ) {}

  find(relations: string[] = new Array()): Promise<GroupKit[]> {
    return this.groupKitsRepository.find({ relations });
  }

  findOne(id: number, relations?: string[]): Promise<GroupKit> {
    return this.groupKitsRepository.findOne(id, { relations });
  }

  async create(input: GroupKitInput): Promise<GroupKit> {
    const kit = new GroupKit();

    kit.name = input.name;
    kit.description = input.description;

    return this.groupKitsRepository.save(kit);
  }

  async update(id: number, input: GroupKitInput): Promise<GroupKit> {
    const kit = await this.findOne(id);

    if (!kit) {
      throw new NotFoundException();
    }

    kit.name = input.name;
    kit.description = input.description;

    return this.groupKitsRepository.save(kit);
  }

  async remove(id: number) {
    const kit = await this.findOne(id);

    if (!kit) {
      throw new NotFoundException();
    }

    return this.groupKitsRepository.remove(kit);
  }

  async removeMany(ids: number[]) {
    const groups = await this.groupKitsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.groupKitsRepository.remove(groups);
  }

  async updateMedia(id: number, file: MulterFile) {
    const kit = await this.findOne(id);

    if (!kit) {
      StorageManager.remove(file.fieldname);
      throw new NotFoundException();
    }

    StorageManager.remove(kit.image);
    kit.image = file.filename;

    return this.groupKitsRepository.save(kit);
  }

  async removeMedia(id: number) {
    const kit = await this.findOne(id);

    if (!kit) {
      throw new NotFoundException();
    }

    StorageManager.remove(kit.image);
    kit.image = null;

    return this.groupKitsRepository.save(kit);
  }
}
