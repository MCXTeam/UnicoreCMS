import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { PageInput } from './dto/page.input';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Post()
  create(@Body() body: PageInput) {
    return this.pagesService.create(body);
  }

  @Public()
  @Get()
  find() {
    return this.pagesService.find();
  }

  @Public()
  @Get("rules")
  rules() {
    return this.pagesService.rules();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const page = await this.pagesService.findOne(id);

    if (!page) {
      throw new NotFoundException();
    }

    return page;
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() body: PageInput) {
    return this.pagesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.pagesService.remove(id);
  }
}
