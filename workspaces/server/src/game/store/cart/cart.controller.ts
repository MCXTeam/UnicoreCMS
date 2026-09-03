import { Audit, IpAddress } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { assertServerPermission } from 'src/admin/roles/guards/permisson.guard';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PayloadType } from '../dto/paginated-store.dto';
import { CartService } from './cart.service';
import { CartBuyInput } from './dto/cart-buy.input';
import { CartInput } from './dto/cart.input.dto';
import { GiveKitInput } from './dto/give-kit.input';
import { GiveProductInput } from './dto/give-product.input';

@Controller('store/cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get('servers')
  findFilledServers(@CurrentUser() user: User) {
    return this.cartService.findFilledServers(user);
  }

  @Get(':server')
  findByServer(@CurrentUser() user: User, @Param('server') id: string) {
    return this.cartService.findByServer(user, id);
  }

  @Post('add')
  add(@CurrentUser() user: User, @Body() body: CartInput) {
    return this.cartService.add(user, body);
  }

  @Audit({ action: 'store.purchase', meta: ['server'] })
  @Post('buy')
  buy(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: CartBuyInput) {
    return this.cartService.buy(user, ip, body);
  }

  @Delete('server/:id')
  clearOwn(@CurrentUser() user: User, @Param('id') id: string) {
    return this.cartService.clearOwn(user, id);
  }

  @Delete('item/:type/:id')
  removeOwn(@CurrentUser() user: User, @Param('type') type: PayloadType, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.removeOwn(user, type, id);
  }

  @Permissions(['panel.access', 'panel.users.update'])
  @Delete('admin/user/:uuid')
  clear(@Param('uuid') user_uuid: string) {
    return this.cartService.clear(user_uuid);
  }

  @Permissions(['panel.access', 'panel.users.update'])
  @Delete('admin/item/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cartService.remove(id);
  }

  @Permissions(['panel.access'])
  @Post('admin/give/product')
  async giveProduct(@Req() request: any, @Body() body: GiveProductInput) {
    await assertServerPermission(request, 'panel.users.give', body.server_id);

    return this.cartService.giveProductByDTO(body);
  }

  @Permissions(['panel.access'])
  @Post('admin/give/kit')
  async giveKit(@Req() request: any, @Body() body: GiveKitInput) {
    await assertServerPermission(request, 'panel.users.give', body.server_id);

    return this.cartService.giveKitByDTO(body);
  }
}
