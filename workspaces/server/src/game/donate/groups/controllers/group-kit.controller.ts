import { DeleteManyInput, imageFileFilter, NumberSortInput, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { GroupKitInput } from '../dto/group-kit.input';
import { GroupKitsService } from '../providers/group-kit.service';

@Controller('donates/group-kits')
export class GroupKitsController {
  constructor(private groupKitsService: GroupKitsService) {}

  @Permissions(['panel.access', 'panel.donate.kits.create'])
  @Post()
  create(@Body() body: GroupKitInput) {
    return this.groupKitsService.create(body);
  }

  @Permissions(['panel.access', 'panel.donate.kits.update'])
  @Post('sort')
  sort(@Body() body: NumberSortInput) {
    return this.groupKitsService.sort(body);
  }

  @Permissions([['panel.donate.read.*', 'panel.users.donate.*'], { or: true }])
  @Get()
  find() {
    return this.groupKitsService.find();
  }

  @Permissions(['panel.access', 'panel.donate.kits.delete.many'])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.groupKitsService.removeMany(body.items);
  }

  @Permissions([['panel.donate.read.*', 'panel.users.donate.*'], { or: true }])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.groupKitsService.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions(['panel.access', 'panel.donate.kits.update'])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GroupKitInput) {
    return this.groupKitsService.update(id, body);
  }

  @Permissions(['panel.access', 'panel.donate.kits.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupKitsService.remove(id);
  }

  @Permissions(['panel.access', 'panel.donate.kits.update'])
  @Patch('image/:server/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('server') server: string, @Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.groupKitsService.updateMedia(server, id, file);
  }

  @Permissions(['panel.access', 'panel.donate.kits.update'])
  @Delete('image/:server/:id')
  removeMedia(@Param('server') server: string, @Param('id', ParseIntPipe) id: number) {
    return this.groupKitsService.removeMedia(server, id);
  }
}
