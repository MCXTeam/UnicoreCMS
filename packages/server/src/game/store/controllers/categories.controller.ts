import { DeleteManyInput, imageFileFilter, StorageManager } from '@common';
import { Body, Controller, Get, Post, Patch, Param, Delete, UseInterceptors, ParseIntPipe, UploadedFile } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Category } from '../entities/category.entity';
import { CategoriesService } from '../providers/categories.service';

@Controller('store/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.categoriesService.find(query);
  }

  @Post()
  create(@Body() body: Category) {
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Category) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  @Delete('bulk/:any')
  removeMany(@Body() body: DeleteManyInput) {
    return this.categoriesService.removeMany(body.items);
  }

  @Patch('icon/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.categoriesService.updateIcon(id, file);
  }

  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.removeIcon(id);
  }
}
