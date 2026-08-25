import { DeleteManyInput, imageFileFilter, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
import { Body, Controller, Get, Post, Patch, Param, Delete, UseInterceptors, ParseIntPipe, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { anyServerPermission, Permission } from 'unicore-common';
import { CategoryInput } from '../dto/category.input';
import { CategoriesService } from '../providers/categories.service';

@Controller('store/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Permissions([
    [Permission.EditorStoreRead, Permission.AdminUsersGive, anyServerPermission(Permission.AdminUsersGiveServer)],
    { or: true },
  ])
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.categoriesService.find(query);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryCreate])
  @Post()
  create(@Body() body: CategoryInput) {
    return this.categoriesService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryDeleteMany])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.categoriesService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: CategoryInput) {
    return this.categoriesService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryUpdate])
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

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreCategoryUpdate])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.removeIcon(id);
  }
}
