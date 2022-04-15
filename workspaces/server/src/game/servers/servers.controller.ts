import { imageFileFilter, StorageManager } from '@common';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permission } from 'unicore-common';
import { ServerCreateInput } from './dto/server-create.input';
import { ServerUpdateInput } from './dto/server-update.input';
import { ServersSortInput } from './dto/servers-sort.input';
import { ServerMedia } from './enums/server-media.enum';
import { ServersService } from './servers.service';

@Controller('servers')
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Permissions([Permission.AdminDashboard, Permission.AdminServersCreate])
  @Post()
  create(@Body() body: ServerCreateInput) {
    return this.serversService.create(body);
  }

  @Public()
  @Get()
  find() {
    return this.serversService.find();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const server = await this.serversService.findOne(id, ['mods', 'query', 'table']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: ServerUpdateInput) {
    return this.serversService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Post('sort')
  sort(@Body() body: ServersSortInput) {
    return this.serversService.sort(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersDelete])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serversService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Patch(':type/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id') id: string, @Param('type', new ParseEnumPipe(ServerMedia)) type: ServerMedia, @UploadedFile() file: MulterFile) {
    return this.serversService.updateMedia(id, type, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Delete(':type/:id')
  removeMedia(@Param('id') id: string, @Param('type', new ParseEnumPipe(ServerMedia)) type: ServerMedia) {
    return this.serversService.removeMedia(id, type);
  }
}
