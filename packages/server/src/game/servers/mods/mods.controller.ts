import { DeleteManyInput, imageFileFilter, StorageManager } from '@common';
import { Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Public } from 'src/auth/decorators/public.decorator';
import { ModInput } from './dto/mod.input';
import { ModsService } from './mods.service';

@Controller('servers/mods')
export class ModsController {
  constructor(
    private modsService: ModsService
  ) { }

  @Public()
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.modsService.find(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.findOne(id);
  }

  @Post()
  create(@Body() body: ModInput) {
    return this.modsService.create(body)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: ModInput) {
    return this.modsService.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.remove(id)
  }

  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.modsService.removeMany(body.items)
  }

  @Patch('icon/:id')
  @UseInterceptors(
    FileFastifyInterceptor("file", {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    })
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.modsService.updateMedia(id, file)
  }

  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.modsService.removeMedia(id)
  }
}
