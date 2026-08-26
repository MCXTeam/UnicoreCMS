import { DeleteManyInput, imageFileFilter, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { ModInput } from './dto/mod.input';
import { ModsService } from './mods.service';

@Controller('servers/mods')
export class ModsController {
  constructor(private modsService: ModsService) {}

  @Permissions(['panel.access', 'panel.mods.read'])
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.modsService.find(query);
  }

  @Permissions(['panel.access', 'panel.mods.delete.many'])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.modsService.removeMany(body.items);
  }

  @Permissions(['panel.access', 'panel.mods.read'])
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.findOne(id);
  }

  @Permissions(['panel.access', 'panel.mods.create'])
  @Post()
  create(@Body() body: ModInput) {
    return this.modsService.create(body);
  }

  @Permissions(['panel.access', 'panel.mods.update'])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: ModInput) {
    return this.modsService.update(id, body);
  }

  @Permissions(['panel.access', 'panel.mods.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.remove(id);
  }

  @Permissions(['panel.access', 'panel.mods.update'])
  @Patch('icon/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.modsService.updateMedia(id, file);
  }

  @Permissions(['panel.access', 'panel.mods.update'])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.removeMedia(id);
  }
}
