import { DeleteManyInput, imageFileFilter, StorageManager, zipFileFilter } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { ProductFromGameInput } from '../dto/product-fromgame.dto';
import { ProductsManyInput } from '../dto/product-many.input';
import { ProductInput } from '../dto/product.dto';
import { ProductsImportInput } from '../dto/products-import.input';
import { ProductsService } from '../providers/product.service';

@Controller('store/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.productsService.find(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id, ['categories', 'servers']);
  }

  @Get("protected/servers")
  servers() {
    return this.productsService.servers();
  }

  @Post()
  create(@Body() body: ProductInput) {
    return this.productsService.create(body);
  }

  @Post("from_game")
  createFromGame(@Body() body: ProductFromGameInput) {
    return this.productsService.createFromGame(body);
  }

  @Post("export")
  async exportItems(@Body() body: DeleteManyInput) {
    const file = await this.productsService.exportItems(body.items);
    return file;
  }

  @Post('import')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: zipFileFilter,
    }),
  )
  importItems(@Body() body: ProductsImportInput, @UploadedFile() file: MulterFile) {
    console.log(body)
    return this.productsService.importItems(body, file.filename);
  }
  
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: ProductInput) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.productsService.removeMany(body.items);
  }

  @Patch('bulk/:ids')
  updateMany(@Body() body: ProductsManyInput) {
    return this.productsService.updateMany(body);
  }

  @Patch('icon/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.productsService.updateIcon(id, file);
  }

  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.removeIcon(id);
  }
}
