import { DeleteManyInput, Paginate, PaginateQuery, STORAGE_MAX_IMAGE_UPLOAD, StorageManager, imageFileFilter } from '@common';
import { Body, Controller, Get, Post, Patch, Param, Delete, UseInterceptors, ParseIntPipe, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { CategoryInput } from '../dto/category.input';
import { CategoriesService } from '../providers/categories.service';

@Controller('store/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Permissions([
    ['panel.store.read.*', 'panel.users.give.*'],
    { or: true },
  ])
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.categoriesService.find(query);
  }

  @Permissions(['panel.access', 'panel.store.categories.create'])
  @Post()
  create(@Body() body: CategoryInput) {
    return this.categoriesService.create(body);
  }

  @Permissions(['panel.access', 'panel.store.categories.delete.many'])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.categoriesService.removeMany(body.items);
  }

  @Permissions(['panel.access', 'panel.store.categories.update'])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: CategoryInput) {
    return this.categoriesService.update(id, body);
  }

  @Permissions(['panel.access', 'panel.store.categories.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  @Permissions(['panel.access', 'panel.store.categories.update'])
  @Patch('icon/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.categoriesService.updateIcon(id, file);
  }

  @Permissions(['panel.access', 'panel.store.categories.update'])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.removeIcon(id);
  }
}
