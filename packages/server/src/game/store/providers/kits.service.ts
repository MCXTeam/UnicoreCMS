import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { KitInput } from '../dto/kit.input.dto';
import { Category } from '../entities/category.entity';
import { Kit } from '../entities/kit.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class KitsService {
  constructor(
    @InjectRepository(Kit)
    private kitsRepository: Repository<Kit>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async find(query: PaginateQuery): Promise<Paginated<Kit>> {
    const queryBuilder = this.kitsRepository
      .createQueryBuilder('kit')
      .leftJoinAndSelect('kit.servers', 'servers')
      .leftJoinAndSelect('kit.categories', 'categories');

    if (query?.filter?.servers && !Array.isArray(query.filter.servers)) query.filter.servers = query.filter.servers.split(',');

    if (query?.filter?.categories && !Array.isArray(query.filter.categories)) query.filter.categories = query.filter.categories.split(',');

    if (query.filter?.servers && query.filter?.categories) {
      queryBuilder.andWhere('servers.id IN(:...servers) AND categories.id IN(:...categories)', {
        servers: query.filter.servers,
        categories: query.filter.categories,
      });
    } else if (query.filter?.servers) {
      queryBuilder.andWhere('servers.id IN(:...ids)', { ids: query.filter.servers });
    } else if (query.filter?.categories) {
      queryBuilder.andWhere('categories.id IN(:...ids)', { ids: query.filter.categories });
    }

    const ids = (await queryBuilder.getMany()).map((kit) => kit.id);

    const qb = this.kitsRepository
      .createQueryBuilder('kit')
      .leftJoinAndSelect('kit.servers', 'servers')
      .leftJoinAndSelect('kit.categories', 'categories')
      .where({
        id: In(ids),
      });

    return paginate(query, qb, {
      sortableColumns: ['id', 'name'],
      searchableColumns: ['id', 'name'],
      defaultSortBy: [['id', 'DESC']],
      maxLimit: 500,
    });
  }

  findOne(id: number, relations?: string[]) {
    return this.kitsRepository.findOne(id, { relations });
  }

  async create(input: KitInput) {
    const kit = new Kit();

    kit.name = input.name;
    kit.description = input.description;
    kit.price = input.price;
    kit.sale = input.sale;

    kit.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    kit.categories = await this.categoriesRepository.find({
      id: In(input.categories),
    });

    kit.items = await Promise.all(
      input.items.map(async (item) => ({
        amount: item.amount,
        product: await this.productsRepository.findOne(item.product_id),
      })),
    );

    return this.kitsRepository.save(kit);
  }

  async update(id: number, input: KitInput) {
    const kit = await this.findOne(id);

    if (!kit) {
      throw new NotFoundException();
    }

    kit.name = input.name;
    kit.description = input.description;

    kit.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    kit.categories = await this.categoriesRepository.find({
      id: In(input.categories),
    });

    kit.items = await Promise.all(
      input.items.map(async (item) => ({
        amount: item.amount,
        product: await this.productsRepository.findOne(item.product_id),
      })),
    );

    return this.kitsRepository.save(kit);
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException();
    }

    return this.kitsRepository.remove(category);
  }

  async removeMany(ids: number[]) {
    const products = await this.kitsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.kitsRepository.remove(products);
  }

  async updateIcon(id: number, file: MulterFile) {
    const kit = await this.findOne(id);

    if (!kit) {
      StorageManager.remove(file.fieldname);
      throw new NotFoundException();
    }

    StorageManager.remove(kit.icon);
    kit.icon = file.filename;

    return this.kitsRepository.save(kit);
  }

  async removeIcon(id: number) {
    const kit = await this.findOne(id);

    if (!kit) {
      throw new NotFoundException();
    }

    StorageManager.remove(kit.icon);
    kit.icon = null;

    return this.kitsRepository.save(kit);
  }
}
