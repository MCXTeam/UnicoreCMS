import { Body, Controller, Get, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { TwoFactorInput } from '../dto/two_factor.input';
import { TwoFactorService } from '../providers/two_factor.service';

@Controller('cabinet/2fa')
export class TwoFactorController {
  constructor(private twoFactorService: TwoFactorService) {}

  @Get('generate')
  generate(@CurrentUser() user: User) {
    return this.twoFactorService.generate(user);
  }

  @Permissions([Permission.UserCabinet2FAOn])
  @Post('enable')
  connect(@CurrentUser() user: User, @Body() body: TwoFactorInput) {
    return this.twoFactorService.enable(user, body);
  }

  @Permissions([Permission.UserCabinet2FAOff])
  @Post('disable')
  disable(@CurrentUser() user: User, @Body() body: TwoFactorInput) {
    return this.twoFactorService.disable(user, body);
  }
}
