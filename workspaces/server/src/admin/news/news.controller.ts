import {
  Audit,
  DeleteManyInput,
  LAUNCHER_NEWS_LIMIT,
  Paginate,
  PaginateQuery,
  STORAGE_MAX_IMAGE_UPLOAD,
  StorageManager,
  imageFileFilter,
} from '@common';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Permissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { NewsInput } from './dto/news.input';
import { NewsPublishInput } from './dto/news-publish.input';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  private async seesHidden(request: any): Promise<boolean> {
    if (!request?.user) return false;

    return matchPermission(
      [['panel.news.hidden', 'panel.news.create', 'panel.news.update', 'panel.news.delete'], { or: true }],
      request,
    );
  }

  @Public()
  @Get()
  async find(@Req() request: any, @Paginate() query: PaginateQuery) {
    return this.newsService.find(query, await this.seesHidden(request));
  }

  @Public()
  @Get('helper/sitemap')
  findForMap() {
    return this.newsService.findForMap();
  }

  @Public()
  @Get('gml')
  findForGml(@Query('limit', new DefaultValuePipe(LAUNCHER_NEWS_LIMIT), ParseIntPipe) limit: number) {
    return this.newsService.findForGml(limit);
  }

  @Audit({ action: 'content.delete', target: 'news' })
  @Delete('bulk')
  @Permissions(['panel.access', 'panel.news.delete.many'])
  removeMany(@Body() body: DeleteManyInput) {
    return this.newsService.removeMany(body.items);
  }

  @Permissions(['panel.access', 'panel.news.publish'])
  @Post('deliveries/:id/retry')
  retryDelivery(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.retryDelivery(id);
  }

  @Permissions(['panel.access', 'panel.news.publish'])
  @Get('publish/targets')
  publishTargets() {
    return this.newsService.publishTargets();
  }

  @Public()
  @Get(':id')
  async findOne(@Req() request: any, @Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id, await this.seesHidden(request));
  }

  @Audit({ action: 'content.create', target: 'news' })
  @Post()
  @Permissions(['panel.access', 'panel.news.create'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  async create(
    @Req() request: any,
    @CurrentUser() user: User,
    @Body() body: NewsInput,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.newsService.create(body, file, Boolean(user.superuser), await matchPermission(['panel.news.publish'], request));
  }

  @Audit({ action: 'content.update', target: 'news', param: 'id' })
  @Patch(':id')
  @Permissions(['panel.access', 'panel.news.update'])
  update(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: NewsInput) {
    return this.newsService.update(id, body, Boolean(user.superuser));
  }

  @Permissions(['panel.access', 'panel.news.publish'])
  @Audit({ action: 'content.update', target: 'news', param: 'id', meta: ['event'] })
  @Post(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @Body() body: NewsPublishInput) {
    return this.newsService.publish(id, body.mode, body.webhooks);
  }

  @Permissions(['panel.access', 'panel.news.publish'])
  @Get(':id/deliveries')
  deliveries(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.deliveries(id);
  }

  @Audit({ action: 'content.delete', target: 'news', param: 'id' })
  @Delete(':id')
  @Permissions(['panel.access', 'panel.news.delete'])
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.remove(id);
  }

  @Permissions(['panel.access', 'panel.news.update'])
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

  @Permissions(['panel.access', 'panel.news.update'])
  @Delete('image/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.removeMedia(id);
  }
}
