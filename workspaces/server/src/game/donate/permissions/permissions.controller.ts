import { DeleteManyInput, IpAddress } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { PermissionBuyInput } from './dto/permission-buy.input';
import { PermissionInput } from './dto/permission.input';
import { DonatePermissionsService } from './permissions.service';

@Controller('donates/permissions')
export class PermissionsController {
  constructor(private donatePermissionsService: DonatePermissionsService) {}

  @Permissions([Permission.AdminDashboard, Permission.EditorDonatePermsCreate])
  @Post()
  create(@Body() body: PermissionInput) {
    return this.donatePermissionsService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateRead])
  @Get()
  find() {
    return this.donatePermissionsService.find(['servers']);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.donatePermissionsService.me(user);
  }

  @Get('server/:id')
  async findByServer(@Param('id') id: string) {
    return await this.donatePermissionsService.findByServer(id);
  }

  @Post('buy')
  async buy(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: PermissionBuyInput) {
    return this.donatePermissionsService.buy(user, ip, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateRead])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.donatePermissionsService.findOne(id, ['periods', 'servers', 'kits']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonatePermsUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: PermissionInput) {
    return this.donatePermissionsService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonatePermsDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donatePermissionsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonatePermsDeleteMany])
  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.donatePermissionsService.removeMany(body.items);
  }
}
