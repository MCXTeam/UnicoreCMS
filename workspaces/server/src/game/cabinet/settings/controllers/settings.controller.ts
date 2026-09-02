import { Body, Controller, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { AllowPasswordPending } from 'src/auth/decorators/allow-password-pending.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PasswordChangeInput } from '../dto/password-change.input';
import { SettingsService } from '../providers/settings.service';

@Controller('cabinet/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @AllowPasswordPending()
  @Permissions(['player.password.change'])
  @Post('password')
  passord(@CurrentUser() user: User, @Body() body: PasswordChangeInput) {
    return this.settingsService.changePassword(user, body);
  }
}
