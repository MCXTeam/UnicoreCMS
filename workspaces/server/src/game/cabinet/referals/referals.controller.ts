import { Controller, Get } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ReferalsService } from './referals.service';

@Controller('cabinet/referals')
export class ReferalsController {
  constructor(private referalsService: ReferalsService) {}

  @Get('me/inviter')
  meInviter(@CurrentUser() user: User) {
    return this.referalsService.getInviter(user);
  }

  @Get('me')
  meReferals(@CurrentUser() user: User) {
    return this.referalsService.getReferals(user);
  }

  @Get('me/percent')
  async mePercent(@CurrentUser() user: User) {
    const [percent, rewards] = await Promise.all([
      this.referalsService.paymentPercent(user),
      this.referalsService.rewardsEnabled(user.uuid),
    ]);

    return { percent, rewards };
  }
}
