import { Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { WarehouseGivedInput } from './dto/warehouse-gived.input';
import { WarehouseService } from './warehouse.service';

@Controller('store/warehouse')
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @Get('servers')
  findFilledServers(@CurrentUser() user: User) {
    return this.warehouseService.findFilledServers(user);
  }

  @Get(':server')
  async findOwn(@CurrentUser() user: User, @Param('server') server_id: string) {
    return this.warehouseService.findOwn(user, server_id);
  }

  @Permissions(['kernel.connect'])
  @Get(':uuid/:server')
  async find(@Param('uuid') user_uuid: string, @Param('server') server_id: string) {
    return this.warehouseService.find(user_uuid, server_id);
  }

  @Permissions(['kernel.connect'])
  @Post()
  afterGive(@Body(new ParseArrayPipe({ items: WarehouseGivedInput })) body: WarehouseGivedInput[]) {
    return this.warehouseService.afterGive(body);
  }

  @Permissions(['panel.access', 'panel.users.read'])
  @Get('admin/:uuid/:server')
  async findFromAdmin(@Param('uuid') user_uuid: string, @Param('server') server_id: string) {
    return this.warehouseService.find(user_uuid, server_id);
  }

  @Permissions(['panel.access', 'panel.users.update'])
  @Delete('admin/:id')
  async take(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.take(id);
  }
}
