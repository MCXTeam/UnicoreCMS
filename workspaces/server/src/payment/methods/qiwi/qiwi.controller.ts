import { IpAddress } from '@common';
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { QiwiService } from './qiwi.service';

@Controller('payment/methods/qiwi')
export class QiwiController {
  constructor(private qiwiService: QiwiService) { }

  @Post('link')
  link(@CurrentUser() user: User, @Body() body: PaymentCreateDto) {
    return this.qiwiService.createLink(user, body)
  }

  @Public()
  @Post('handler')
  handler(@IpAddress() ip: string, @Body() body, @Headers('X-Api-Signature-SHA256') sign: string) {
    return this.qiwiService.handler(ip, { ...body, sign })
  }
}
