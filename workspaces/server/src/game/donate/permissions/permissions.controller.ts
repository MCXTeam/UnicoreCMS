import { NumberSortInput, DeleteManyInput, IpAddress } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { assertServerPermission } from 'src/admin/roles/guards/permisson.guard';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { GiveDonatePermInput } from './dto/give-donate-perm.input';
import { PermissionBuyInput } from './dto/permission-buy.input';
import { PermissionInput } from './dto/permission.input';
import { DonatePermissionsService } from './permissions.service';

@Controller('donates/permissions')
export class PermissionsController {
  constructor(private donatePermissionsService: DonatePermissionsService) {}

  @Permissions(['panel.access', 'panel.donate.permissions.create'])
  @Post()
  create(@Req() request: any, @Body() body: PermissionInput) {
    return this.donatePermissionsService.create(body, request);
  }

  @Permissions(['panel.access', 'panel.donate.permissions.update'])
  @Post('sort')
  sort(@Body() body: NumberSortInput) {
    return this.donatePermissionsService.sort(body);
  }

  @Permissions([
    ['panel.donate.read', 'panel.users.donate', 'panel.users.donate.*'],
    { or: true },
  ])
  @Get()
  find() {
    return this.donatePermissionsService.find(['servers', 'kits', 'periods']);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.donatePermissionsService.me(user);
  }

  @Permissions(['panel.access', 'panel.donate.permissions.delete.many'])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.donatePermissionsService.removeMany(body.items);
  }

  @Permissions(['kernel.connect'])
  @Get('user/:server/:uuid')
  findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.donatePermissionsService.findByUserAndServer(server, uuid);
  }

  @Get('server/:id')
  async findByServer(@Param('id') id: string) {
    return await this.donatePermissionsService.findByServer(id);
  }

  @Get('server/uc/:id')
  async findByServerUC(@Param('id') id: string) {
    return await this.donatePermissionsService.findByServerUC(id);
  }

  @Permissions(['player.donate.permission.buy'])
  @Post('buy')
  async buy(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: PermissionBuyInput) {
    return this.donatePermissionsService.buy(user, ip, body);
  }

  @Permissions([
    ['panel.donate.read', 'panel.users.donate', 'panel.users.donate.*'],
    { or: true },
  ])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.donatePermissionsService.findOne(id, ['periods', 'servers', 'kits']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions(['panel.access', 'panel.donate.permissions.update'])
  @Patch(':id')
  update(@Req() request: any, @Param('id', ParseIntPipe) id: number, @Body() body: PermissionInput) {
    return this.donatePermissionsService.update(id, body, request);
  }

  @Permissions(['panel.access', 'panel.donate.permissions.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donatePermissionsService.remove(id);
  }

  @Permissions(['panel.access', 'panel.users.read'])
  @Get('admin/:uuid')
  udgByUUID(@Param('uuid') uuid: string) {
    return this.donatePermissionsService.udpByUUID(uuid);
  }

  @Permissions(['panel.access'])
  @Post('admin/give')
  async give(@Req() request: any, @Body() body: GiveDonatePermInput) {
    await assertServerPermission(request, 'panel.users.donate', body.server_id);

    return this.donatePermissionsService.giveByDTO(body);
  }

  @Permissions(['panel.access', 'panel.users.donate'])
  @Delete('admin/:id')
  take(@Param('id', ParseIntPipe) id: number) {
    return this.donatePermissionsService.take(id);
  }
}
