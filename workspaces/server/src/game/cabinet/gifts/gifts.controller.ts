import { DeleteManyInput, ThrottlerCoreGuard } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { GiftActivateInput } from './dto/gift-activate.input';
import { GiftInput } from './dto/gift.input';
import { GiftsService } from './gifts.service';
import { GiftPurchaseService } from './gift-purchase.service';
import { GiftPurchaseInput } from './dto/gift-purchase.input';
import { IpAddress } from 'src/common/decorators/IpAddress.decorator';

@Controller('cabinet/gifts')
export class GiftsController {
  constructor(private giftsService: GiftsService, private giftPurchaseService: GiftPurchaseService) {}

  @Permissions(['player.gift.activate'])
  @UseGuards(ThrottlerCoreGuard)
  @Recaptcha({ action: 'gift' })
  @Post('activate')
  giftActivate(@CurrentUser() user: User, @Body() input: GiftActivateInput) {
    return this.giftsService.activate(user, input.gift_code);
  }

  @Permissions(['player.gift.buy'])
  @UseGuards(ThrottlerCoreGuard)
  @Post('purchase')
  purchase(@CurrentUser() user: User, @IpAddress() ip: string, @Body() input: GiftPurchaseInput) {
    return this.giftPurchaseService.purchase(user, ip, input);
  }

  @Permissions(['player.gift.buy'])
  @Get('my')
  mine(@CurrentUser() user: User) {
    return this.giftPurchaseService.mine(user);
  }

  @Permissions(['panel.access', 'panel.gifts.create'])
  @Post()
  create(@Body() body: GiftInput) {
    return this.giftsService.create(body);
  }

  @Permissions(['panel.access', 'panel.gifts.read'])
  @Get()
  find() {
    return this.giftsService.find();
  }

  @Permissions(['panel.access', 'panel.gifts.delete.many'])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.giftsService.removeMany(body.items);
  }

  @Permissions(['panel.access', 'panel.gifts.read'])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.giftsService.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions(['panel.access', 'panel.gifts.update'])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GiftInput) {
    return this.giftsService.update(id, body);
  }

  @Permissions(['panel.access', 'panel.gifts.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.giftsService.remove(id);
  }
}
