import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_PASSWORD_CHANGE, ThrottlerCoreGuard } from '@common';
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
  @UseGuards(ThrottlerCoreGuard)
  @Throttle({ default: THROTTLE_PASSWORD_CHANGE })
  @Post('password')
  passord(@CurrentUser() user: User, @Body() body: PasswordChangeInput) {
    return this.settingsService.changePassword(user, body);
  }
}
