import { DeleteManyInput, imageFileFilter, StorageManager } from '@common';
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
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { GroupKitInput } from '../dto/group-kit.input';
import { GroupKitsService } from '../providers/group-kit.service';

@Controller('donates/group-kits')
export class GroupKitsController {
  constructor(private groupKitsService: GroupKitsService) {}

  @Post()
  create(@Body() body: GroupKitInput) {
    return this.groupKitsService.create(body);
  }

  @Get()
  find() {
    return this.groupKitsService.find();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.groupKitsService.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GroupKitInput) {
    return this.groupKitsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupKitsService.remove(id);
  }

  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.groupKitsService.removeMany(body.items);
  }

  @Patch('image/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.groupKitsService.updateMedia(id, file);
  }

  @Delete('image/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.groupKitsService.removeMedia(id);
  }
}
