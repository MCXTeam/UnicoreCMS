import { StorageManager } from '@common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
import { CategoryInput } from './../dto/category.input';
import { Category } from './../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) {}

  find(query: PaginateQuery): Promise<Paginated<Category>> {
    return paginate(query, this.categoriesRepository, {
      sortableColumns: ['id', 'name'],
      searchableColumns: ['id', 'name'],
      defaultSortBy: [['id', 'DESC']],
      maxLimit: 500,
    });
  }

  findOne(id: number, relations?: string[]) {
    return this.categoriesRepository.findOne(id, { relations })
  }

  create(input: CategoryInput) {
    const category = new Category();

    category.name = input.name;
    category.description = input.description;

    return this.categoriesRepository.save(category);
  }

  async update(id: number, input: CategoryInput) {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException();
    }

    category.name = input.name;
    category.description = input.description;

    return this.categoriesRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException();
    }

    return this.categoriesRepository.remove(category);
  }

  async removeMany(ids: number[]) {
    const products = await this.categoriesRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.categoriesRepository.remove(products);
  }

  async updateIcon(id: number, file: MulterFile) {
    const category = await this.findOne(id);

    if (!category) {
      StorageManager.remove(file.fieldname);
      throw new NotFoundException();
    }

    StorageManager.remove(category.icon);
    category.icon = file.filename;

    return this.categoriesRepository.save(category);
  }

  async removeIcon(id: number) {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException();
    }

    StorageManager.remove(category.icon);
    category.icon = null;

    return this.categoriesRepository.save(category);
  }
}
