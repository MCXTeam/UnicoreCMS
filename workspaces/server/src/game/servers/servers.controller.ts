import { imageFileFilter, NumberSortInput, STORAGE_MAX_IMAGE_UPLOAD, StorageManager, StringSortInput } from '@common';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { GalleryImageInput } from './dto/gallery.input';
import { ServerCreateInput } from './dto/server-create.input';
import { ServerUpdateInput } from './dto/server-update.input';
import { ServerMedia } from './enums/server-media.enum';
import { ServersService } from './servers.service';

@Controller('servers')
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Permissions(['panel.access', 'panel.servers.create'])
  @Post()
  create(@Req() request: any, @Body() body: ServerCreateInput) {
    return this.serversService.create(body, request);
  }

  @Public()
  @Get()
  find() {
    return this.serversService.find();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const server = await this.serversService.findOne(id, ['mods', 'query', 'table', 'instances']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions([['panel.servers.read', 'panel.servers.update'], { or: true }])
  @Get(':id/admin')
  async findOneAdmin(@Param('id') id: string) {
    const server = await this.serversService.findOne(id, ['mods', 'query', 'table', 'rcon', 'instances']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions(['panel.access', 'panel.servers.update'])
  @Patch(':id')
  update(@Req() request: any, @Param('id') id: string, @Body() body: ServerUpdateInput) {
    return this.serversService.update(id, body, request);
  }

  @Permissions(['panel.access', 'panel.servers.update'])
  @Post('sort')
  sort(@Body() body: StringSortInput) {
    return this.serversService.sort(body);
  }

  @Permissions(['panel.access', 'panel.servers.delete'])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serversService.remove(id);
  }

  @Public()
  @Get(':id/gallery')
  gallery(@Param('id') id: string) {
    return this.serversService.gallery(id);
  }

  @Permissions(['panel.access', 'panel.servers.update'])
  @Post(':id/gallery')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  addGalleryImage(@Param('id') id: string, @Body() body: GalleryImageInput, @UploadedFile() file: Express.Multer.File) {
    return this.serversService.addGalleryImage(id, body, file);
  }

  @Permissions(['panel.access', 'panel.servers.update'])
  @Post(':id/gallery/sort')
  sortGallery(@Param('id') id: string, @Body() body: NumberSortInput) {
    return this.serversService.sortGallery(id, body);
  }

  @Permissions(['panel.access', 'panel.servers.update'])
  @Delete(':id/gallery/:imageId')
  removeGalleryImage(@Param('id') id: string, @Param('imageId', ParseIntPipe) imageId: number) {
    return this.serversService.removeGalleryImage(id, imageId);
  }

  @Permissions(['panel.access', 'panel.servers.update'])
  @Patch(':type/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(
    @Param('id') id: string,
    @Param('type', new ParseEnumPipe(ServerMedia)) type: ServerMedia,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.serversService.updateMedia(id, type, file);
  }

  @Permissions(['panel.access', 'panel.servers.update'])
  @Delete(':type/:id')
  removeMedia(@Param('id') id: string, @Param('type', new ParseEnumPipe(ServerMedia)) type: ServerMedia) {
    return this.serversService.removeMedia(id, type);
  }
}
