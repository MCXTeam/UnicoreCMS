import { Controller, Get, Param } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
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
}
