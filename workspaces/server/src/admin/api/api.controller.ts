import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { ApiService } from './api.service';
import { ApiInput } from './dto/api.input';

@Permissions(['panel.api.read'])
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

  @Permissions(['panel.api.manage'])
  @Post()
  create(@Body() body: ApiInput) {
    return this.apiService.create(body);
  }

  @Permissions(['panel.api.manage'])
  @Patch(':secret')
  update(@Param('secret') secret: string, @Body() body: ApiInput) {
    return this.apiService.update(secret, body);
  }

  @Permissions(['panel.api.manage'])
  @Delete(':secret')
  remove(@Param('secret') secret: string) {
    return this.apiService.remove(secret);
  }
}
