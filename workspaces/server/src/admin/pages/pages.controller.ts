import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Permissions } from '../roles/decorators/permission.decorator';
import { PageInput } from './dto/page.input';
import { PagePathInput } from './dto/page-path.input';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Permissions(['panel.access', 'panel.pages.create'])
  @Post()
  create(@CurrentUser() user: User, @Body() body: PageInput) {
    return this.pagesService.create(body, Boolean(user.superuser));
  }

  @Public()
  @Get()
  find() {
    return this.pagesService.find();
  }

  @Public()
  @Get('rules')
  rules() {
    return this.pagesService.rules();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const page = await this.pagesService.findOne(id);

    if (!page) {
      throw new NotFoundException();
    }

    return page;
  }

  @Public()
  @Post('path')
  async findByPath(@Body() input: PagePathInput) {
    const page = await this.pagesService.findByPath(input.path);

    if (!page) {
      throw new NotFoundException();
    }

    return page;
  }

  @Permissions(['panel.access', 'panel.pages.update'])
  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: PageInput) {
    return this.pagesService.update(id, body, Boolean(user.superuser));
  }

  @Permissions(['panel.access', 'panel.pages.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.remove(id);
  }
}
