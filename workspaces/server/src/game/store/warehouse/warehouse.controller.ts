import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { WarehouseGivedInput } from './dto/warehouse-gived.input';
import { WarehouseService } from './warehouse.service';

@Controller('store/warehouse')
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @Get(':server')
  async findOwn(@CurrentUser() user: User, @Param('server') server_id: string) {
    return this.warehouseService.findOwn(user, server_id);
  }

  @SkipThrottle()
  @Permissions([Permission.KernelUnicoreConnect])
  @Get(':uuid/:server')
  async find(@Param('uuid') user_uuid: string, @Param('server') server_id: string) {
    return this.warehouseService.find(user_uuid, server_id);
  }

  @SkipThrottle()
  @Permissions([Permission.KernelUnicoreConnect])
  @Post()
  afterGive(@Body() body: WarehouseGivedInput[]) {
    return this.warehouseService.afterGive(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersUpdate])
  @Get('admin/:uuid/:server')
  async findFromAdmin(@Param('uuid') user_uuid: string, @Param('server') server_id: string) {
    return this.warehouseService.find(user_uuid, server_id);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersUpdate])
  @Delete('admin/:id')
  async take(@Param('id') id: number) {
    return this.warehouseService.take(id);
  }
}
