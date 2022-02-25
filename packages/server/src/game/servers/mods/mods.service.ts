import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
import { ModInput } from './dto/mod.input';
import { Mod } from './entities/mod.entity';

@Injectable()
export class ModsService {
  constructor(
    @InjectRepository(Mod)
    private modsRepository: Repository<Mod>,
  ) {}

  find(query: PaginateQuery): Promise<Paginated<Mod>> {
    return paginate(query, this.modsRepository, {
      sortableColumns: ['id', 'name'],
      searchableColumns: ['id', 'name'],
      defaultSortBy: [['id', 'DESC']],
      maxLimit: 500,
    });
  }

  findOne(id: number, relations?: string[]) {
    return this.modsRepository.findOne(id, { relations });
  }

  async create(input: ModInput): Promise<Mod> {
    const mod = new Mod();

    mod.name = input.name;
    mod.description = input.description;

    return this.modsRepository.save(mod);
  }

  async update(id: number, input: ModInput): Promise<Mod> {
    const mod = await this.findOne(id);

    if (!mod) {
      throw new NotFoundException();
    }

    mod.name = input.name;
    mod.description = input.description;

    return this.modsRepository.save(mod);
  }

  async remove(id: number) {
    const mod = await this.findOne(id);

    if (!mod) {
      throw new NotFoundException();
    }

    return this.modsRepository.remove(mod);
  }

  async removeMany(ids: number[]) {
    const mods = await this.modsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.modsRepository.remove(mods);
  }

  async updateMedia(id: number, file: MulterFile) {
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
