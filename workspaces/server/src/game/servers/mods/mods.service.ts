import { assertServerEntities, assertServerList } from 'src/admin/roles/server-scope';
import { PaginateQuery, Paginated, StorageManager, paginate } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ModInput } from './dto/mod.input';
import { Mod } from './entities/mod.entity';

const assertModScope = async (request: any, permission: string, mod: Mod): Promise<void> => {
  await assertServerList(request, permission, (mod.servers || []).map((server) => server.id));
};

@Injectable()
export class ModsService {
  constructor(
    @InjectRepository(Mod)
    private modsRepository: Repository<Mod>,
  ) {}

  find(query: PaginateQuery, allowed: string[] | null = null): Promise<Paginated<Mod>> {
    if (allowed) {
      const scoped = this.modsRepository
        .createQueryBuilder('mod')
        .leftJoin('mod.servers', 'servers')
        .where('servers.id IN(:...allowed)', { allowed: allowed.length ? allowed : [null] });

      return paginate(query, scoped, {
        sortableColumns: ['id', 'name'],
        searchableColumns: ['id', 'name'],
        defaultSortBy: [['name', 'ASC']],
        maxLimit: 500,
      });
    }

    return paginate(query, this.modsRepository, {
      sortableColumns: ['id', 'name'],
      searchableColumns: ['id', 'name'],
      defaultSortBy: [['name', 'ASC']],
      maxLimit: 500,
    });
  }

  findOne(id: number, relations?: string[]) {
    return this.modsRepository.findOne({ where: { id }, relations });
  }

  async create(input: ModInput): Promise<Mod> {
    const mod = new Mod();

    mod.name = input.name;
    mod.description = input.description;
    mod.link = input.link;

    return this.modsRepository.save(mod);
  }

  async update(id: number, input: ModInput, request?: any): Promise<Mod> {
    const mod = await this.findOne(id, ['servers']);

    if (!mod) {
      throw new NotFoundException();
    }

    await assertModScope(request, 'panel.mods.update', mod);

    mod.name = input.name;
    mod.description = input.description;
    mod.link = input.link;

    return this.modsRepository.save(mod);
  }

  async remove(id: number, request?: any) {
    const mod = await this.findOne(id, ['servers']);

    if (!mod) {
      throw new NotFoundException();
    }

    await assertModScope(request, 'panel.mods.delete', mod);

    return this.modsRepository.remove(mod);
  }

  async removeMany(ids: number[], request?: any) {
    const mods = await this.modsRepository.find({
      where: {
        id: In(ids),
      },
      relations: ['servers'],
    });

    await assertServerEntities(request, 'panel.mods.delete.many', mods);

    return this.modsRepository.remove(mods);
  }

  async updateMedia(id: number, file: Express.Multer.File) {
    const mod = await this.findOne(id);

    if (!mod) {
      StorageManager.remove(file.filename);
      throw new NotFoundException();
    }

    StorageManager.remove(mod.icon);
    mod.icon = file.filename;

    return this.modsRepository.save(mod);
  }

  async removeMedia(id: number) {
    const mod = await this.findOne(id);

    if (!mod) {
      throw new NotFoundException();
    }

    StorageManager.remove(mod.icon);
    mod.icon = null;

    return this.modsRepository.save(mod);
  }
}
