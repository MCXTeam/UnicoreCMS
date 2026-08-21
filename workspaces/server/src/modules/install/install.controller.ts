import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE_MAX_ZIP_UPLOAD } from '@common';
import { SuperUserGuard } from 'src/admin/roles/guards/superuser.guard';
import { StorageManager } from 'src/common/storage/storage.class';
import { zipFileFilter } from 'src/common/storage/filters/zip-filter';
import { InstallService } from './install.service';

@Controller('admin/extensions')
@UseGuards(SuperUserGuard)
export class InstallController {
  constructor(private readonly service: InstallService) {}

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
}
