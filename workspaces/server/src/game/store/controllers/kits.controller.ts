import { DeleteManyInput, imageFileFilter, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { KitInput } from '../dto/kit.input.dto';
import { KitsService } from '../providers/kits.service';

@Controller('store/kits')
export class KitsController {
  constructor(private kitsService: KitsService) {}

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreRead])
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.kitsService.find(query);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreKitsDeleteMany])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.kitsService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreRead])
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const kit = this.kitsService.findOne(id, ['items', 'servers', 'categories']);

    if (!kit) throw new NotFoundException();

    return kit;
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreKitsCreate])
  @Post()
  create(@Body() body: KitInput) {
    return this.kitsService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreKitsUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: KitInput) {
    return this.kitsService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreKitsDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.kitsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreKitsUpdate])
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

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreKitsUpdate])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.kitsService.removeIcon(id);
  }
}
