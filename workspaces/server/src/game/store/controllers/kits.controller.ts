import { Audit, DeleteManyInput, Paginate, PaginateQuery, STORAGE_MAX_IMAGE_UPLOAD, StorageManager, imageFileFilter } from '@common';
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseIntPipe,
  UploadedFile,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { allowedServersAny } from 'src/admin/roles/server-scope';
import { KitInput } from '../dto/kit.input.dto';
import { KitsService } from '../providers/kits.service';

@Controller('store/kits')
export class KitsController {
  constructor(private kitsService: KitsService) {}

  @Permissions([['panel.store.read.*', 'panel.users.give.*'], { or: true }])
  @Get()
  async find(@Req() request: any, @Paginate() query: PaginateQuery) {
    return this.kitsService.find(query, await allowedServersAny(request, ['panel.store.read', 'panel.users.give']));
  }

  @Permissions(['panel.access', 'panel.store.kits.delete.many.*'])
  @Audit({ action: 'content.delete', target: 'kit' })
  @Delete('bulk')
  removeMany(@Req() request: any, @Body() body: DeleteManyInput) {
    return this.kitsService.removeMany(body.items, request);
  }

  @Permissions([['panel.store.read.*', 'panel.users.give.*'], { or: true }])
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const kit = this.kitsService.findOne(id, ['items', 'servers', 'categories']);

    if (!kit) throw new NotFoundException();

    return kit;
  }

  @Permissions(['panel.access', 'panel.store.kits.create.*'])
  @Audit({ action: 'content.create', target: 'kit' })
  @Post()
  create(@Req() request: any, @Body() body: KitInput) {
    return this.kitsService.create(body, request);
  }

  @Permissions(['panel.access', 'panel.store.kits.update.*'])
  @Audit({ action: 'content.update', target: 'kit', param: 'id' })
  @Patch(':id')
  update(@Req() request: any, @Param('id', ParseIntPipe) id: number, @Body() body: KitInput) {
    return this.kitsService.update(id, body, request);
  }

  @Permissions(['panel.access', 'panel.store.kits.delete.*'])
  @Audit({ action: 'content.delete', target: 'kit', param: 'id' })
  @Delete(':id')
  remove(@Req() request: any, @Param('id', ParseIntPipe) id: number) {
    return this.kitsService.remove(id, request);
  }

  @Permissions(['panel.access', 'panel.store.kits.update.*'])
  @Patch('icon/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.kitsService.updateIcon(id, file);
  }

  @Permissions(['panel.access', 'panel.store.kits.update.*'])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.kitsService.removeIcon(id);
  }
}
