import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TwoFactorInput } from '../dto/two_factor.input';
import { TwoFactorService } from '../providers/two_factor.service';

@Controller('cabinet/2fa')
export class TwoFactorController {
  constructor (private twoFactorService: TwoFactorService) {}

  @Get('generate')
  generate(@CurrentUser() user: User) {
    return this.twoFactorService.generate(user)
  }

  @Post('enable')
  connect(@CurrentUser() user: User, @Body() body: TwoFactorInput) {
    return this.twoFactorService.enable(user, body)
  }

  @Post('disable')
  disable(@CurrentUser() user: User, @Body() body: TwoFactorInput) {
    return this.twoFactorService.disable(user, body)
  }
}
