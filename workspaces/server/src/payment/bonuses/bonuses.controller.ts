import { imageFileFilter, StorageManager } from "@common";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileFastifyInterceptor, MulterFile } from "fastify-file-interceptor";
import { BonusesService } from "./bonuses.service";
import { BonusInput } from "./dto/bonus.dto";
import { Bonus } from "./entities/bonus.entity";

@Controller('payment/bonuses')
export class BonusesController {
  constructor(private bonusesService: BonusesService) {}

  @Get()
  findAll(): Promise<Bonus[]> {
    return this.bonusesService.find();
  }

  @Post()
  create(@Body() body: BonusInput) {
    return this.bonusesService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: BonusInput) {
    return this.bonusesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bonusesService.remove(id);
  }

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

  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.bonusesService.removeIcon(id);
  }
}