import { DeleteManyInput, imageFileFilter, StorageManager, zipFileFilter } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { ProductFromGameInput } from '../dto/product-fromgame.dto';
import { ProductsManyInput } from '../dto/product-many.input';
import { ProductInput } from '../dto/product.dto';
import { ProductsImportInput } from '../dto/products-import.input';
import { ProductsService } from '../providers/product.service';

@Controller('store/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreRead])
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.productsService.find(query);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreRead])
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id, ['categories', 'servers']);
  }

  @Get("protected/servers")
  servers() {
    return this.productsService.servers();
  }

  @Get("protected/servers/:id")
  server(@Param('id') id: string) {
    return this.productsService.server(id);
  }

  @Get("protected/kit/:id")
  kit(@Param('id') id: number) {
    return this.productsService.kit(id);
  }

  @Get("protected/products")
  store(@Paginate() query: PaginateQuery) {
    return this.productsService.store(query);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsCreate])
  @Post()
  create(@Body() body: ProductInput) {
    return this.productsService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.KernelUnicoreConnect])
  @Post("from_game")
  createFromGame(@Body() body: ProductFromGameInput) {
    return this.productsService.createFromGame(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsExport])
  @Post("export")
  async exportItems(@Body() body: DeleteManyInput) {
    const file = await this.productsService.exportItems(body.items);
    return file;
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsImport])
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
  
  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: ProductInput) {
    return this.productsService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsDeleteMany])
  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.productsService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsUpdateMany])
  @Patch('bulk/:ids')
  updateMany(@Body() body: ProductsManyInput) {
    return this.productsService.updateMany(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsUpdate])
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

  @Permissions([Permission.AdminDashboard, Permission.EditorStoreProductsUpdate])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.removeIcon(id);
  }
}
