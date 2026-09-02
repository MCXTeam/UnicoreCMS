import { assertServerEntities, assertServerList } from 'src/admin/roles/server-scope';
import { PaginateQuery, Paginated, StorageManager, assertUploadedFile, paginate } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
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

  async find(query: PaginateQuery, allowed: string[] | null = null): Promise<Paginated<Kit>> {
    const queryBuilder = this.kitsRepository
      .createQueryBuilder('kit')
      .leftJoinAndSelect('kit.servers', 'servers')
      .leftJoinAndSelect('kit.categories', 'categories');

    if (allowed) queryBuilder.andWhere('servers.id IN(:...allowed)', { allowed: allowed.length ? allowed : [null] });

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
    return this.kitsRepository.findOne({ where: { id }, relations });
  }

  async create(input: KitInput, request?: any) {
    await assertServerList(request, 'panel.store.kits.create', input.servers);

    const kit = new Kit();

    kit.name = input.name;
    kit.description = input.description;
    kit.price = currencyUtils.roundByType(input.price, SystemCurrency.REAL);
    kit.sale = input.sale;
    kit.virtual_percent = input.virtual_percent;
    kit.giftable = input.giftable !== false;

    kit.servers = await this.serversRepository.findBy({
      id: In(input.servers),
    });

    kit.categories = await this.categoriesRepository.findBy({
      id: In(input.categories),
    });

    kit.items = await Promise.all(
      input.items.map(async (item) => ({
        amount: item.amount,
        product: await this.productsRepository.findOneBy({ id: item.product_id }),
      })),
    );

    return this.kitsRepository.save(kit);
  }

  async update(id: number, input: KitInput, request?: any) {
    const kit = await this.findOne(id, ['servers']);

    if (!kit) {
      throw new NotFoundException();
    }

    await assertServerList(request, 'panel.store.kits.update', input.servers, (kit.servers || []).map((server) => server.id));

    kit.name = input.name;
    kit.price = currencyUtils.roundByType(input.price, SystemCurrency.REAL);
    kit.sale = input.sale;
    kit.description = input.description;
    kit.virtual_percent = input.virtual_percent;
    kit.giftable = input.giftable !== false;

    kit.servers = await this.serversRepository.findBy({
      id: In(input.servers),
    });

    kit.categories = await this.categoriesRepository.findBy({
      id: In(input.categories),
    });

    kit.items = await Promise.all(
      input.items.map(async (item) => ({
        amount: item.amount,
        product: await this.productsRepository.findOneBy({ id: item.product_id }),
      })),
    );

    return this.kitsRepository.save(kit);
  }

  async remove(id: number, request?: any) {
    const category = await this.findOne(id, ['servers']);

    if (!category) {
      throw new NotFoundException();
    }

    await assertServerEntities(request, 'panel.store.kits.delete', [category]);

    return this.kitsRepository.remove(category);
  }

  async removeMany(ids: number[], request?: any) {
    const products = await this.kitsRepository.find({
      where: {
        id: In(ids),
      },
      relations: ['servers'],
    });

    await assertServerEntities(request, 'panel.store.kits.delete.many', products);

    return this.kitsRepository.remove(products);
  }

  async updateIcon(id: number, file: Express.Multer.File) {
    assertUploadedFile(file);

    const kit = await this.findOne(id);

    if (!kit) {
      StorageManager.remove(file.filename);
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
