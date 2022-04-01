import { Body, Controller, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { PasswordChangeInput } from '../dto/password-change.input';
import { SettingsService } from '../providers/settings.service';

@Controller('cabinet/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Permissions([Permission.UserCabinetPasswordChange])
  @Post('password')
  passord(@CurrentUser() user: User, @Body() body: PasswordChangeInput) {
    return this.settingsService.changePassword(user, body)
  }
}
