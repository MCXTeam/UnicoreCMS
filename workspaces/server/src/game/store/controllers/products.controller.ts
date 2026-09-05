import {
  Audit,
  DeleteManyInput,
  Paginate,
  PaginateQuery,
  STORAGE_MAX_IMAGE_UPLOAD,
  STORAGE_MAX_ZIP_UPLOAD,
  StorageManager,
  imageFileFilter,
  zipFileFilter,
} from '@common';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { allowedServersAny } from 'src/admin/roles/server-scope';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ProductFromGameInput } from '../dto/product-fromgame.dto';
import { ProductsManyInput } from '../dto/product-many.input';
import { ProductInput } from '../dto/product.dto';
import { ProductsImportInput } from '../dto/products-import.input';
import { ProductsService } from '../providers/product.service';

@Controller('store/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Permissions([['panel.store.read.*', 'panel.users.give.*'], { or: true }])
  @Get()
  async find(@Req() request: any, @Paginate() query: PaginateQuery) {
    return this.productsService.find(query, await allowedServersAny(request, ['panel.store.read', 'panel.users.give']));
  }

  @Permissions(['panel.access', 'panel.store.products.delete.many.*'])
  @Audit({ action: 'content.delete', target: 'product' })
  @Delete('bulk')
  removeMany(@Req() request: any, @Body() body: DeleteManyInput) {
    return this.productsService.removeMany(body.items, request);
  }

  @Permissions(['panel.access', 'panel.store.products.update.many.*'])
  @Patch('bulk')
  updateMany(@Req() request: any, @Body() body: ProductsManyInput) {
    return this.productsService.updateMany(body, request);
  }

  @Permissions([['panel.store.read.*', 'panel.users.give.*'], { or: true }])
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id, ['categories', 'servers']);
  }

  @Get('protected/servers')
  servers() {
    return this.productsService.servers();
  }

  @Get('protected/servers/:id')
  server(@Param('id') id: string) {
    return this.productsService.server(id);
  }

  @Get('protected/kit/:id')
  kit(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.kit(id);
  }

  @Get('protected/products')
  store(@Paginate() query: PaginateQuery) {
    return this.productsService.store(query);
  }

  @Permissions(['panel.access', 'panel.store.products.create.*'])
  @Audit({ action: 'content.create', target: 'product' })
  @Post()
  create(@Req() request: any, @Body() body: ProductInput) {
    return this.productsService.create(body, request);
  }

  @Permissions(['kernel.connect'])
  @Post('from_game')
  createFromGame(@Body() body: ProductFromGameInput) {
    return this.productsService.createFromGame(body);
  }

  @Permissions(['panel.access', 'panel.store.products.export'])
  @Post('export')
  async exportItems(@Body() body: DeleteManyInput) {
    const file = await this.productsService.exportItems(body.items);
    return file;
  }

  @Permissions(['panel.access', 'panel.store.products.import.*'])
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: zipFileFilter,
      limits: { fileSize: STORAGE_MAX_ZIP_UPLOAD, files: 1 },
    }),
  )
  async importItems(@CurrentUser() user: User, @Body() body: ProductsImportInput, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException();

    const allowCommands = await matchPermission(['panel.access', 'panel.servers.update'], { user });

    return this.productsService.importItems(body, file.filename, allowCommands);
  }

  @Permissions(['panel.access', 'panel.store.products.update.*'])
  @Audit({ action: 'content.update', target: 'product', param: 'id' })
  @Patch(':id')
  update(@Req() request: any, @Param('id', ParseIntPipe) id: number, @Body() body: ProductInput) {
    return this.productsService.update(id, body, request);
  }

  @Permissions(['panel.access', 'panel.store.products.delete.*'])
  @Audit({ action: 'content.delete', target: 'product', param: 'id' })
  @Delete(':id')
  remove(@Req() request: any, @Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id, request);
  }

  @Permissions(['panel.access', 'panel.store.products.update.*'])
  @Patch('icon/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.productsService.updateIcon(id, file);
  }

  @Permissions(['panel.access', 'panel.store.products.update.*'])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.removeIcon(id);
  }
}
