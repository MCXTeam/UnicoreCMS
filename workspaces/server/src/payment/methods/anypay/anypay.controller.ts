import { IpAddress } from '@common';
import { Body, Controller, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permission } from 'unicore-common';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { AnypayService } from './anypay.service';

@Controller('payment/methods/anypay')
export class AnypayController {
  constructor (private anypayService: AnypayService) {}

  @Permissions([Permission.UserPayment])
  @Post('link')
  link(@IpAddress() ip: string, @CurrentUser() user: User, @Body() body: PaymentCreateDto) {
    return this.anypayService.createLink(user, body, ip)
  }

  @Public()
  @Post('handler')
  handler(@IpAddress() ip: string, @Body() body) {
    return this.anypayService.handler(ip, body)
  }
}
