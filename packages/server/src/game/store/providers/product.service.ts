import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import * as _ from 'lodash';
import { FilterOperator, paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { ProductsManyInput } from '../dto/product-many.input';
import { ProductInput } from '../dto/product.dto';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) { }

  async find(query: PaginateQuery): Promise<Paginated<Product>> {
    const queryBuilder = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.servers', 'servers')
      .leftJoinAndSelect('product.categories', 'categories');

    if (query?.filter?.servers && !Array.isArray(query.filter.servers))
      query.filter.servers = query.filter.servers.split(',')

    if (query?.filter?.categories && !Array.isArray(query.filter.categories))
      query.filter.categories = query.filter.categories.split(',')

    if (query.filter?.servers && query.filter?.categories) {
      queryBuilder.andWhere("servers.id IN(:...servers) AND categories.id IN(:...categories)", { 
        servers: query.filter.servers,
        categories: query.filter.categories,
      })
    } else if (query.filter?.servers) {
      queryBuilder.andWhere("servers.id IN(:...ids)", { ids: query.filter.servers })
    } else if (query.filter?.categories) {
      queryBuilder.andWhere("categories.id IN(:...ids)", { ids: query.filter.categories })
    }

    const ids = (await queryBuilder.getMany()).map(product => product.id)
    
    const qb = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.servers', 'servers')
      .leftJoinAndSelect('product.categories', 'categories')
      .where({
        id: In(ids)
      })

    return paginate(query, qb, {
      sortableColumns: ['id', 'name', 'price', 'sale'],
      searchableColumns: ['id', 'name', 'item_id', 'price', 'sale'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        price: [FilterOperator.GTE, FilterOperator.LTE],
        sale: [FilterOperator.GTE, FilterOperator.LTE]
      },
      maxLimit: 500,
    });
  }

  findOne(id: number, relations?: string[]) {
    return this.productsRepository.findOne(id, { relations })
  }

  async create(input: ProductInput) {
    const product = new Product();

    product.name = input.name;
    product.description = input.description;
    product.price = input.price;
    product.sale = input.sale;
    product.item_id = input.item_id;

    product.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    product.categories = await this.categoriesRepository.find({
      id: In(input.categories),
    });

    return this.productsRepository.save(product);
  }

  async update(id: number, input: ProductInput) {
    const product = await this.findOne(id);

    if (!product) {
      throw new NotFoundException();
    }

    product.name = input.name;
    product.description = input.description;
    product.price = input.price;
    product.sale = input.sale;
    product.item_id = input.item_id;

    product.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    product.categories = await this.categoriesRepository.find({
      id: In(input.categories),
    });

    return this.productsRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);

    if (!product) {
      throw new NotFoundException();
    }

    return this.productsRepository.remove(product);
  }

  async removeMany(ids: number[]) {
    const products = await this.productsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.productsRepository.remove(products);
  }

  async updateMany(input: ProductsManyInput) {
    const products = await this.productsRepository.find({
      where: {
        id: In(input.products.map(entity => entity.id)),
      },
      relations: ['servers', 'categories']
    });

    const productsEdited = await Promise.all(products.map(async product => {
      var { sale, price, servers, categories } = input.products.find(entity => entity.id === product.id)

      if (sale)
        product.sale = sale

      if (sale === 0)
        product.sale = null

      if (price)
        product.price = price

      if (servers && servers.length)
        product.servers = await this.serversRepository.find({ where: { id: In(servers) } })

      if (categories && categories.length)
        product.categories = await this.categoriesRepository.find({ where: { id: In(categories) } })

      return product
    }))

    return this.productsRepository.save(productsEdited);
  }

  async updateIcon(id: number, file: MulterFile) {
    const product = await this.findOne(id);

    if (!product) {
      StorageManager.remove(file.fieldname);
      throw new NotFoundException();
    }

    StorageManager.remove(product.icon);
    product.icon = file.filename;

    return this.productsRepository.save(product);
  }

  async removeIcon(id: number) {
    const product = await this.findOne(id);

    if (!product) {
      throw new NotFoundException();
    }

    StorageManager.remove(product.icon);
    product.icon = null;

    return this.productsRepository.save(product);
  }
}
