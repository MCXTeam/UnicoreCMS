import { NumberSortInput, StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { GroupKitInput } from '../dto/group-kit.input';
import { GroupKitServer } from '../entities/group-kit-server.entity';
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
    return this.groupKitsRepository.findOne({ where: { id }, relations });
  }

  async create(input: GroupKitInput): Promise<GroupKit> {
    const kit = new GroupKit();

    kit.name = input.name;
    kit.description = input.description;

    return this.groupKitsRepository.save(kit);
  }

  async sort(input: NumberSortInput) {
    const servers = await this.groupKitsRepository.findBy({ id: In(input.items.map((srv) => srv.id)) });

    return this.groupKitsRepository.save(
      servers.map((kit) => {
        const updatedSort = input.items.find((kt) => kt.id == kit.id);

        if (updatedSort) return { ...kit, priority: updatedSort.priority };

        return kit;
      }),
    );
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

  private async overrideOf(server_id: string, id: number): Promise<{ kit: GroupKit; server: Server; row: GroupKitServer }> {
    const server = await this.serversRepository.findOneBy({ id: server_id });
    const kit = await this.findOne(id);

    if (!kit || !server) throw new NotFoundException();

    let row = kit.servers.find((item) => item.server.id == server.id);

    if (!row) {
      row = new GroupKitServer();
      row.server = server;
    }

    return { kit, server, row };
  }

  private save(kit: GroupKit, server: Server, row: GroupKitServer | null) {
    kit.servers = kit.servers.filter((item) => item.server.id != server.id).concat(row ? [row] : []);

    return this.groupKitsRepository.save(kit);
  }

  async updateMedia(server_id: string, id: number, file: Express.Multer.File) {
    let override: { kit: GroupKit; server: Server; row: GroupKitServer };

    try {
      override = await this.overrideOf(server_id, id);
    } catch (error) {
      StorageManager.remove(file.filename);
      throw error;
    }

    const { kit, server, row } = override;

    if (row.image) StorageManager.remove(row.image);

    row.image = file.filename;

    return this.save(kit, server, row);
  }

  async removeMedia(server_id: string, id: number) {
    const { kit, server, row } = await this.overrideOf(server_id, id);

    if (row.image) StorageManager.remove(row.image);

    row.image = null;

    return this.save(kit, server, row.description ? row : null);
  }

  async updateDescription(server_id: string, id: number, description: string) {
    const { kit, server, row } = await this.overrideOf(server_id, id);

    row.description = description?.trim() || null;

    return this.save(kit, server, row.description || row.image ? row : null);
  }
}
