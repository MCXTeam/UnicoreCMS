import { imageFileFilter, StorageManager } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
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
  @Permissions([Permission.AdminDashboard, Permission.EditorPaymentBonusesGiftsCreate])
  create(@Body() body: BonusInput) {
    return this.bonusesService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorPaymentBonusesUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: BonusInput) {
    return this.bonusesService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorPaymentBonusesDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bonusesService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorPaymentBonusesUpdate])
  @Patch('icon/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.bonusesService.updateIcon(id, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorPaymentBonusesUpdate])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.bonusesService.removeIcon(id);
  }
}
