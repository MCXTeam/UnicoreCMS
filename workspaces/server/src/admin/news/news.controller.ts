import { DeleteManyInput, imageFileFilter, StorageManager } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permission } from 'unicore-common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { NewsInput } from './dto/news.input';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Public()
  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.newsService.find(query);
  }

  @Public()
  @Get('helper/sitemap')
  findForMap() {
    return this.newsService.findForMap();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  @Post()
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsCreate])
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  create(@Body() body: NewsInput, @UploadedFile() file?: MulterFile) {
    return this.newsService.create(body, file);
  }

  @Patch(':id')
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsUpdate])
  update(@Param('id', ParseIntPipe) id: number, @Body() body: NewsInput,) {
    return this.newsService.update(id, body);
  }

  @Delete(':id')
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsDelete])
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.remove(id);
  }

  @Delete('bulk/:any')
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsDeleteMany])
  removeMany(@Body() body: DeleteManyInput) {
    return this.newsService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsUpdate])
  @Patch('image/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.newsService.updateMedia(id, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsUpdate])
  @Delete('image/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.removeMedia(id);
  }
}
