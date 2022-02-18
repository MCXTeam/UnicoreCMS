import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiInput } from './dto/api.input';

@Controller('admin/api')
export class ApiController {
  constructor(private apiService: ApiService) {}

  @Get()
  find() {
    return this.apiService.find();
  }

  @Get(':secret')
  async findOne(@Param('secret') secret: string) {
    const apikey = await this.apiService.findOne(secret);

    if (!apikey) {
      throw new NotFoundException();
    }

    return apikey;
  }

  @Post()
  create(@Body() body: ApiInput) {
    return this.apiService.create(body);
  }

  @Patch(':secret')
  update(@Param('secret') secret: string, @Body() body: ApiInput) {
    return this.apiService.update(secret, body);
  }

  @Delete(':secret')
  remove(@Param('secret') secret: string) {
    return this.apiService.remove(secret);
  }
}
