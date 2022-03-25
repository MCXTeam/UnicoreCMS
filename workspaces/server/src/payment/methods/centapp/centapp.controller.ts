import { IpAddress } from '@common';
import { Body, Controller, Post } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { CentappService } from './centapp.service';

@Controller('payment/methods/centapp')
export class CentappController {
  constructor (private centappService: CentappService) {}

  @Post('link')
  link(@CurrentUser() user: User, @Body() body: PaymentCreateDto) {
    return this.centappService.createLink(user, body)
  }

  @Public()
  @Post('handler')
  handler(@IpAddress() ip: string, @Body() body) {
    return this.centappService.handler(ip, body)
  }
}
