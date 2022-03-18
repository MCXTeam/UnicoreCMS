import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { WarehouseRejectInput } from './dto/warehouse-reject.input';
import { WarehouseService } from './warehouse.service';

@Controller('store/warehouse')
export class WarehouseController {
  constructor (private warehouseService: WarehouseService) {}

  @Get(':server')
  async findOwn(@CurrentUser() user: User, @Param('server') server_id: string) {
    return this.warehouseService.findOwn(user, server_id)
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Get(':uuid/:server')
  async find(@Param('uuid') user_uuid: string, @Param('server') server_id: string) {
    return this.warehouseService.find(user_uuid, server_id)
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Post()
  afterGive(@Body() body: WarehouseRejectInput) {
    return this.warehouseService.afterGive(body)
  }
}
