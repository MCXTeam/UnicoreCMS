import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { GroupKitInput } from '../dto/group-kit.input';
import { GroupKitImage } from '../entities/group-kit-image.entity';
import { GroupKit } from '../entities/group-kit.entity';

@Injectable()
export class GroupKitsService {
  constructor(
    @InjectRepository(GroupKit)
    private groupKitsRepository: Repository<GroupKit>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
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

  async updateMedia(server_id: string, id: number, file: MulterFile) {
    const server = await this.serversRepository.findOne(server_id);
    const kit = await this.findOne(id);
    

    if (!kit || !server) {
      StorageManager.remove(file.filename);
      throw new NotFoundException();
    }

    var gkImage = kit.images.find(img => img.server.id == server.id)

    if (gkImage) {
      StorageManager.remove(gkImage.image);
    } else {
      gkImage = new GroupKitImage()
      gkImage.server = server
    }

    gkImage.image = file.filename;

    kit.images = kit.images.filter(img => img.server.id != server.id).concat([gkImage])

    return this.groupKitsRepository.save(kit);
  }

  async removeMedia(server_id: string, id: number) {
    const server = await this.serversRepository.findOne(server_id);
    const kit = await this.findOne(id);

    if (!kit || !server) {
      throw new NotFoundException();
    }

    var gkImage = kit.images.find(img => img.server.id == server.id)

    if (gkImage) {
      kit.images = kit.images.filter(img => img.server.id != server.id)
    }

    return this.groupKitsRepository.save(kit);
  }
}
