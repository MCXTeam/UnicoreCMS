import { IpAddress } from '@common';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { MoneyWDInput } from './dto/monet-wd.input';
import { MoneyExchangeInput } from './dto/money-exchange.input';
import { MoneyPayCommandInput } from './dto/money-pay-command.input';
import { MoneyUpdateInput } from './dto/money-update.input';
import { MoneyInput } from './dto/money.input';
import { MoneyService } from './money.service';

@Controller('cabinet/money')
export class MoneyController {
  constructor(private moneyService: MoneyService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.moneyService.findOneByUser(user);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Get('user/:server/:uuid')
  async findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.moneyService.findOneByUserUuidAndServer(server, uuid);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Post('user')
  async payCommand(@Body() body: MoneyPayCommandInput) {
    return this.moneyService.payCommand(body);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Post('user/deposit')
  async deposit(@Body() body: MoneyWDInput) {
    return this.moneyService.deposit(body);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Post('user/withdraw')
  async withdraw(@Body() body: MoneyWDInput) {
    return this.moneyService.withdraw(body);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Get('top/:server')
  async findTopByServer(@Param('server') server: string) {
    return this.moneyService.findTopByServer(server);
  }

  @Permissions([Permission.UserCabinetTransfer])
  @Post('own/transfer')
  async transferOwn(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: MoneyInput) {
    return this.moneyService.transfer(user, ip, body);
  }

  @Permissions([Permission.UserCabinetExchange])
  @Post('own/exchange')
  async exchangeOwn(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: MoneyExchangeInput) {
    return this.moneyService.exchange(user, ip, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersRead])
  @Get("admin/:uuid")
  async findOneByUser(@Param('uuid') uuid: string) {
    return this.moneyService.findOneByUser(uuid);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersUpdate])
  @Patch("admin")
  async update(@Body() body: MoneyUpdateInput) {
    return this.moneyService.update(body);
  }
}
