import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Audit, THROTTLE_PASSWORD_CHANGE, THROTTLE_RESEND, THROTTLE_VERIFY, Throttle, ThrottlerCoreGuard } from '@common';
import { EmailService } from 'src/admin/email/email.service';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { AllowPasswordPending } from 'src/auth/decorators/allow-password-pending.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { VerifyInput } from 'src/auth/dto/verify.input';
import { EmailChangeInput } from '../dto/email-change.input';
import { PasswordChangeInput } from '../dto/password-change.input';
import { SettingsService } from '../providers/settings.service';

@Controller('cabinet/settings')
export class SettingsController {
  constructor(
    private settingsService: SettingsService,
    private emailService: EmailService,
  ) {}

  @AllowPasswordPending()
  @Permissions(['player.password.change'])
  @UseGuards(ThrottlerCoreGuard)
  @Throttle(THROTTLE_PASSWORD_CHANGE)
  @Audit({ action: 'auth.password.change' })
  @Post('password')
  passord(@CurrentUser() user: User, @Body() body: PasswordChangeInput) {
    return this.settingsService.changePassword(user, body);
  }

  @Permissions(['player.email.change'])
  @UseGuards(ThrottlerCoreGuard)
  @Throttle(THROTTLE_RESEND)
  @Post('email')
  requestEmail(@CurrentUser() user: User, @Body() body: EmailChangeInput) {
    return this.emailService.sendEmailChange(user, body.email);
  }

  @Permissions(['player.email.change'])
  @UseGuards(ThrottlerCoreGuard)
  @Throttle(THROTTLE_VERIFY)
  @Audit({ action: 'auth.email.change' })
  @Post('email/confirm')
  confirmEmail(@CurrentUser() user: User, @Body() body: VerifyInput) {
    return this.emailService.confirmEmailChange(user, body);
  }
}
