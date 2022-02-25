import { Controller, Get } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { MoneyService } from './money.service';

@Controller('cabinet/money')
export class MoneyController {
  constructor (private moneyService: MoneyService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.moneyService.findOneByUser(user) 
  }
}
