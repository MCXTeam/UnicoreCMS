import { DeleteManyInput } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { GiftInput } from './dto/gift.input';
import { GiftsService } from './gifts.service';

@Controller('cabinet/gifts')
export class GiftsController {
  constructor(private giftsService: GiftsService) {}

  @Permissions([Permission.AdminDashboard, Permission.EditorCabinetGiftsCreate])
  @Post()
  create(@Body() body: GiftInput) {
    return this.giftsService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorCabinetGiftsRead])
  @Get()
  find() {
    return this.giftsService.find();
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorCabinetGiftsRead])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.giftsService.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorCabinetGiftsUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GiftInput) {
    return this.giftsService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorCabinetGiftsDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.giftsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorCabinetGiftsDeleteMany])
  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.giftsService.removeMany(body.items);
  }
}
