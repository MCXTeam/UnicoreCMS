import { Audit, IpAddress } from '@common';
import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { assertServerPermission, matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { allowedServers } from 'src/admin/roles/server-scope';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { MoneyWDInput } from './dto/monet-wd.input';
import { MoneyExchangeInput } from './dto/money-exchange.input';
import { MoneyPayCommandInput } from './dto/money-pay-command.input';
import { MoneyUpdateInput } from './dto/money-update.input';
import { MoneyInput, MoneyTransferType } from './dto/money.input';
import { MoneyService } from './money.service';

@Controller('cabinet/money')
export class MoneyController {
  constructor(private moneyService: MoneyService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.moneyService.findOneByUser(user);
  }

  @Permissions(['kernel.connect'])
  @Get('user/:server/:uuid')
  async findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.moneyService.findOneByUserUuidAndServer(server, uuid);
  }

  @Permissions(['kernel.connect'])
  @Audit({ action: 'money.pay', target: 'user', bodyParam: 'target_uuid', meta: ['server_id', 'amount'] })
  @Post('user')
  async payCommand(@Body() body: MoneyPayCommandInput) {
    return this.moneyService.payCommand(body);
  }

  @Permissions(['kernel.connect'])
  @Audit({ action: 'money.deposit', target: 'user', bodyParam: 'user_uuid', meta: ['server_id', 'amount'] })
  @Post('user/deposit')
  async deposit(@Body() body: MoneyWDInput) {
    return this.moneyService.deposit(body);
  }

  @Permissions(['kernel.connect'])
  @Audit({ action: 'money.withdraw', target: 'user', bodyParam: 'user_uuid', meta: ['server_id', 'amount'] })
  @Post('user/withdraw')
  async withdraw(@Body() body: MoneyWDInput) {
    return this.moneyService.withdraw(body);
  }

  @Permissions(['kernel.connect'])
  @Get('top/:server')
  async findTopByServer(@Param('server') server: string) {
    return this.moneyService.findTopByServer(server);
  }

  @Permissions(['player.transfer'])
  @Audit({ action: 'money.transfer', target: 'user', bodyParam: 'username', meta: ['server', 'amount', 'type'] })
  @Post('own/transfer')
  async transferOwn(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: MoneyInput) {
    return this.moneyService.transfer(user, ip, body);
  }

  @Permissions(['player.exchange'])
  @Audit({ action: 'money.exchange', meta: ['server', 'from_server', 'amount', 'type'] })
  @Post('own/exchange')
  async exchangeOwn(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: MoneyExchangeInput) {
    return this.moneyService.exchange(user, ip, body);
  }

  @Permissions(['panel.access', 'panel.users.read'])
  @Get('admin/:uuid')
  async findOneByUser(@Req() request: any, @Param('uuid') uuid: string) {
    const rows = await this.moneyService.findOneByUser(uuid);
    const allowed = await allowedServers(request, 'panel.users.money');

    return allowed ? rows.filter((row) => allowed.includes(row.server?.id)) : rows;
  }

  @Permissions(['panel.access'])
  @Patch('admin')
  async update(@Req() request: any, @Body() body: MoneyUpdateInput) {
    if (body.type === MoneyTransferType.Money) await assertServerPermission(request, 'panel.users.money', body.server);
    else if (!(await matchPermission(['panel.users.balance.real'], request))) throw new ForbiddenException();

    return this.moneyService.update(body, request);
  }
}
