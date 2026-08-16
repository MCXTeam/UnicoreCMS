import { DeleteManyInput, imageFileFilter, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Permission } from 'unicore-common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { NewsInput } from './dto/news.input';
import { NewsPublishInput } from './dto/news-publish.input';
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

  @Delete('bulk')
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsDeleteMany])
  removeMany(@Body() body: DeleteManyInput) {
    return this.newsService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsPublish])
  @Post('deliveries/:id/retry')
  retryDelivery(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.retryDelivery(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsPublish])
  @Get('publish/targets')
  publishTargets() {
    return this.newsService.publishTargets();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  @Post()
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsCreate])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  create(@CurrentUser() user: User, @Body() body: NewsInput, @UploadedFile() file?: Express.Multer.File) {
    return this.newsService.create(body, file, Boolean(user.superuser));
  }

  @Patch(':id')
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsUpdate])
  update(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: NewsInput) {
    return this.newsService.update(id, body, Boolean(user.superuser));
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsPublish])
  @Post(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @Body() body: NewsPublishInput) {
    return this.newsService.publish(id, body.mode, body.webhooks);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsPublish])
  @Get(':id/deliveries')
  deliveries(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.deliveries(id);
  }

  @Delete(':id')
  @Permissions([Permission.AdminDashboard, Permission.EditorNewsDelete])
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsUpdate])
  @Patch('image/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.newsService.updateMedia(id, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorNewsUpdate])
  @Delete('image/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.removeMedia(id);
  }
}
