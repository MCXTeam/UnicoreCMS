import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { HardwareAdminService } from './hardware-admin.service';
import { HardwareBanInput, HardwareRevokeInput } from './dto/hardware.input';

@Permissions(['panel.access', 'panel.users.read', 'panel.users.hardware.read'])
@Controller('admin/hardware')
export class HardwareAdminController {
  constructor(private admin: HardwareAdminService) {}

  @Get('users/:uuid')
  list(@Param('uuid', ParseUUIDPipe) uuid: string, @Req() request: any) { return this.admin.list(uuid, request); }

  @Permissions(['panel.access', 'panel.users.read', 'panel.users.hardware.read', 'panel.users.hardware.ban'])
  @Post('ban')
  ban(@Body() input: HardwareBanInput, @Req() request: any) { return this.admin.ban(input, request); }

  @Permissions(['panel.access', 'panel.users.read', 'panel.users.hardware.read', 'panel.users.hardware.revoke'])
  @Post(':id/revoke')
  revoke(@Param('id', ParseUUIDPipe) id: string, @Body() input: HardwareRevokeInput, @Req() request: any) { return this.admin.revoke(id, input, request); }
}
