import { Audit, IpAddress } from '@common';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { BansService } from './bans.service';
import { BanFromAdminInput } from './dto/ban-from-admin.input';
import { BanDto } from './dto/ban.dto';
import { BanInput } from './dto/ban.input';

@Controller('bans')
export class BansController {
  constructor(private bansService: BansService) {}

  @Permissions(['player.unban.buy'])
  @Audit({ action: 'unban.purchase' })
  @Post('unban')
  unban(@CurrentUser() user: User, @IpAddress() ip: string) {
    return this.bansService.unban(user, ip);
  }

  @Permissions(['kernel.connect'])
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string): Promise<BanDto> {
    const ban = await this.bansService.findOne(uuid);

    if (!ban) throw new NotFoundException();

    return new BanDto(ban);
  }

  @Permissions(['kernel.connect'])
  @Audit({ action: 'ban.create', target: 'user', bodyParam: 'user_uuid', meta: ['reason', 'expires'] })
  @Post()
  create(@CurrentUser() user: User, @Body() body: BanInput) {
    return this.bansService.create(user, body);
  }

  @Permissions(['kernel.connect'])
  @Audit({ action: 'ban.remove', target: 'user', param: 'uuid' })
  @Delete(':uuid')
  delete(@Param('uuid') uuid: string) {
    return this.bansService.remove(uuid);
  }

  @Permissions(['panel.access', 'panel.users.ban'])
  @Audit({ action: 'ban.create', target: 'user', bodyParam: 'user_uuid', meta: ['reason', 'expires'] })
  @Post('admin')
  createFromAdmin(@CurrentUser() user: User, @Body() body: BanFromAdminInput) {
    return this.bansService.createFromAdmin(user, body);
  }

  @Permissions(['panel.access', 'panel.users.ban'])
  @Audit({ action: 'ban.remove', target: 'user', param: 'uuid' })
  @Delete('admin/:uuid')
  deleteFromAdmin(@Param('uuid') uuid: string) {
    return this.bansService.remove(uuid);
  }
}
