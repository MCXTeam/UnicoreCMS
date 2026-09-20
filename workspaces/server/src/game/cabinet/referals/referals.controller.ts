import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { InviterInput } from './dto/inviter.input';
import { ReferalsService } from './referals.service';

@Controller('cabinet/referals')
export class ReferalsController {
  constructor(private referalsService: ReferalsService) {}

  @Get('me/inviter')
  meInviter(@CurrentUser() user: User) {
    return this.referalsService.getInviter(user);
  }

  @Get('me/inviter/rules')
  meInviterRules(@CurrentUser() user: User) {
    return this.referalsService.bindRules(user);
  }

  @Put('me/inviter')
  bindInviter(@CurrentUser() user: User, @Body() body: InviterInput, @Req() request: unknown) {
    return this.referalsService.bindInviter(user, body.code, request);
  }

  @Get('me')
  meReferals(@CurrentUser() user: User) {
    return this.referalsService.getReferals(user);
  }

  @Get('me/percent')
  async mePercent(@CurrentUser() user: User) {
    return { percent: await this.referalsService.paymentPercent(user) };
  }
}
