import { DeleteManyInput, imageFileFilter, StorageManager } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { GroupInput } from '../dto/group.input';
import { DonateGroupsService } from '../providers/groups.service';

@Controller('donates/groups')
export class DonateGroupsController {
  constructor(private donateGroupsService: DonateGroupsService) {}

  @Post()
  create(@Body() body: GroupInput) {
    return this.donateGroupsService.create(body);
  }

  @Get()
  find() {
    return this.donateGroupsService.find(['servers']);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.donateGroupsService.findOne(id, ['periods', 'servers', 'kits']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GroupInput) {
    return this.donateGroupsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donateGroupsService.remove(id);
  }

  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.donateGroupsService.removeMany(body.items);
  }

  @Patch('icon/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.donateGroupsService.updateIcon(id, file);
  }

  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.donateGroupsService.removeIcon(id);
  }
}
