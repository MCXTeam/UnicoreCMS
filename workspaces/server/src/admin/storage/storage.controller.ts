import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { assertUploadedFile, imageFileFilter, StorageManager, STORAGE_MAX_IMAGE_UPLOAD } from '@common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';

@Controller('storage')
export class StorageController {
  @Permissions(['panel.access'])
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  image(@UploadedFile() file?: Express.Multer.File) {
    const uploaded = assertUploadedFile(file);

    return { file: uploaded.filename, url: StorageManager.url(uploaded.filename) };
  }
}
