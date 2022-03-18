import { DeleteManyInput, imageFileFilter, StorageManager } from '@common';
import { Body, Controller, Get, Post, Patch, Param, Delete, UseInterceptors, ParseIntPipe, UploadedFile } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { Category } from '../entities/category.entity';
import { CategoriesService } from '../providers/categories.service';

@Controller('store/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreRead])
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.categoriesService.find(query);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryCreate])
  @Post()
  create(@Body() body: Category) {
    return this.categoriesService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Category) {
    return this.categoriesService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryDeleteMany])
  @Delete('bulk/:any')
  removeMany(@Body() body: DeleteManyInput) {
    return this.categoriesService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryUpdate])
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

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryUpdate])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.removeIcon(id);
  }
}
