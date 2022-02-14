import { DeleteManyInput } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { GiftInput } from './dto/gift.input';
import { GiftsService } from './gifts.service';

@Controller('cabinet/gifts')
export class GiftsController {
  constructor(private giftsService: GiftsService) {}

  @Post()
  create(@Body() body: GiftInput) {
    return this.giftsService.create(body);
  }

  @Get()
  find() {
    return this.giftsService.find();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.giftsService.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GiftInput) {
    return this.giftsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.giftsService.remove(id);
  }

  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.giftsService.removeMany(body.items);
  }
}
