import { All, Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { envConfig } from 'unicore-common';
import { PaymentStatusesRedirect } from './enums/payment-statuses.enum';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get('methods')
  find() {
    return this.paymentService.getMethods();
  }

  @Get('last')
  async last(@CurrentUser() user: User, @Query('method') method?: string) {
    const payment = await this.paymentService.findLast(user, method);

    if (!payment) return null;

    return {
      id: payment.id,
      method: payment.method,
      amount: payment.amount,
      status: payment.status,
      created: payment.created,
    };
  }

  @Public()
  @Redirect(envConfig.baseurl, 302)
  @All('redirect/:status/:method')
  redirect(@Param('status') status: PaymentStatusesRedirect, @Param('method') method: string) {
    const url = new URL(`${envConfig.baseurl}/payment/`);
    url.searchParams.append('status', status);
    url.searchParams.append('method', method);

    return { url: url.href };
  }
}
