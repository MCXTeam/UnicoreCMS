import { DeleteManyInput, imageFileFilter, StorageManager } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { ModInput } from './dto/mod.input';
import { ModsService } from './mods.service';

@Controller('servers/mods')
export class ModsController {
  constructor(private modsService: ModsService) {}

  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.modsService.find(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.findOne(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorModsCreate])
  @Post()
  create(@Body() body: ModInput) {
    return this.modsService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorModsUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: ModInput) {
    return this.modsService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorModsDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorModsDeleteMany])
  @Delete('bulk/:any')
  removeMany(@Body() body: DeleteManyInput) {
    return this.modsService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorModsUpdate])
  @Patch('icon/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.modsService.updateMedia(id, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorModsUpdate])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.removeMedia(id);
  }
}
