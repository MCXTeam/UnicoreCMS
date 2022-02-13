import { DeleteManyInput } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { PermissionInput } from './dto/permission.input';
import { DonatePermissionsService } from './permissions.service';

@Controller('donates/permissions')
export class PermissionsController {
  constructor(private donatePermissionsService: DonatePermissionsService) {}

  @Post()
  create(@Body() body: PermissionInput) {
    return this.donatePermissionsService.create(body);
  }

  @Get()
  find() {
    return this.donatePermissionsService.find(['servers']);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.donatePermissionsService.findOne(id, ['periods', 'servers', 'kits']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: PermissionInput) {
    return this.donatePermissionsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donatePermissionsService.remove(id);
  }

  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.donatePermissionsService.removeMany(body.items);
  }
}
