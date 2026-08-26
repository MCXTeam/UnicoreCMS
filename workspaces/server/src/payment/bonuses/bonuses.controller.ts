import { imageFileFilter, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { BonusesService } from './bonuses.service';
import { BonusInput } from './dto/bonus.dto';
import { Bonus } from './entities/bonus.entity';

@Controller('payment/bonuses')
export class BonusesController {
  constructor(private bonusesService: BonusesService) {}

  @Get()
  findAll(): Promise<Bonus[]> {
    return this.bonusesService.find();
  }

  @Post()
  @Permissions(['panel.access', 'panel.payment.bonuses.create'])
  create(@Body() body: BonusInput) {
    return this.bonusesService.create(body);
  }

  @Permissions(['panel.access', 'panel.payment.bonuses.update'])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: BonusInput) {
    return this.bonusesService.update(id, body);
  }

  @Permissions(['panel.access', 'panel.payment.bonuses.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bonusesService.remove(id);
  }

  @Permissions(['panel.access', 'panel.payment.bonuses.update'])
  @Patch('icon/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.bonusesService.updateIcon(id, file);
  }

  @Permissions(['panel.access', 'panel.payment.bonuses.update'])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.bonusesService.removeIcon(id);
  }
}
