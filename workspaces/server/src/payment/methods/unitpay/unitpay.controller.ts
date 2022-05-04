import { IpAddress } from '@common';
import { Body, Controller, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permission } from 'unicore-common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { UnitpayService } from './unitpay.service';

@Controller('payment/methods/unitpay')
export class UnitpayController {
  constructor(private unitpayService: UnitpayService) { }

  @Permissions([Permission.UserPayment])
  @Post('link')
  link(@IpAddress() ip: string, @CurrentUser() user: User, @Body() body: PaymentCreateDto) {
    return this.unitpayService.createLink(user, body, ip)
  }

  @Public()
  @Post('handler')
  handler(@IpAddress() ip: string, @Body() body) {
    return this.unitpayService.handler(ip, body)
  }
}
