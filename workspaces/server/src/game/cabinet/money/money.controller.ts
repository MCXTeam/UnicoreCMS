import { IpAddress } from '@common';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { MoneyExchangeInput } from './dto/money-exchange.input';
import { MoneyInput } from './dto/money.input';
import { MoneyService } from './money.service';

@Controller('cabinet/money')
export class MoneyController {
  constructor (private moneyService: MoneyService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.moneyService.findOneByUser(user) 
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Get("user/:server/:uuid")
  async findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.moneyService.findOneByUserAndServer(server, uuid)
  }

  @Post("own/transfer")
  async transferOwn(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: MoneyInput) {
    return this.moneyService.transfer(user, ip, body)
  }

  @Post("own/exchange")
  async exchangeOwn(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: MoneyExchangeInput) {
    return this.moneyService.exchange(user, ip, body)
  }
}
