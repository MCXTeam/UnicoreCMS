import { BadRequestException, Controller, Delete, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Audit, STORAGE_MAX_ZIP_UPLOAD } from '@common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { StorageManager } from 'src/common/storage/storage.class';
import { zipFileFilter } from 'src/common/storage/filters/zip-filter';
import { InstallService } from './install.service';

@Controller('admin/extensions')
@Permissions(['panel.extensions.manage'])
export class InstallController {
  constructor(private readonly service: InstallService) {}

  @Audit({ action: 'module.install' })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: zipFileFilter,
      limits: { fileSize: STORAGE_MAX_ZIP_UPLOAD, files: 1 },
    }),
  )
  install(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');

    return this.service.install(file.filename);
  }

  @Audit({ action: 'module.remove', target: 'module', param: 'id' })
  @Delete(':kind/:id')
  remove(@Param('kind') kind: string, @Param('id') id: string) {
    if (kind !== 'module' && kind !== 'theme') throw new BadRequestException('Неизвестный тип расширения');

    return this.service.remove(kind, id);
  }
}
