import { Body, Controller, Delete, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { BansService } from './bans.service';
import { BanFromAdminInput } from './dto/ban-from-admin.input';
import { BanDto } from './dto/ban.dto';
import { BanInput } from './dto/ban.input';

@SkipThrottle()
@Controller('bans')
export class BansController {
  constructor(private bansService: BansService) {}

  @Permissions([Permission.KernelUnicoreConnect])
  @Post('unban')
  unban(@CurrentUser() user: User) {
    return this.bansService.unban(user);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string): Promise<BanDto> {
    const ban = await this.bansService.findOne(uuid);

    if (!ban) throw new NotFoundException();

    return new BanDto(ban);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Post()
  create(@CurrentUser() user: User, @Body() body: BanInput) {
    return this.bansService.create(user, body);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Delete(':uuid')
  delete(@Param('uuid') uuid: string) {
    return this.bansService.remove(uuid);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Post('admin')
  createFromAdmin(@CurrentUser() user: User, @Body() body: BanFromAdminInput) {
    return this.bansService.createFromAdmin(user, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Delete('admin/:uuid')
  deleteFromAdmin(@Param('uuid') uuid: string) {
    return this.bansService.remove(uuid);
  }
}
