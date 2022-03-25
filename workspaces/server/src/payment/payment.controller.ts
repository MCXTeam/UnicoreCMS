import { All, Controller, Get, Param, Redirect } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { envConfig } from 'unicore-common';
import { PaymentStatusesRedirect } from './enums/payment-statuses.enum';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor (private paymentService: PaymentService) {}

  @Public()
  @Get('methods')
  find() {
    return this.paymentService.getMethods()
  }

  @Public()
  @Redirect('https://docs.nestjs.com', 302)
  @All('redirect/:status/:method')
  redirect(@Param('status') status: PaymentStatusesRedirect, @Param('method') method: string) {
    const url = new URL(`${envConfig.baseurl}/payment/`)
    url.searchParams.append('status', status)
    url.searchParams.append('method', method)

    return { url: url.href };
  }
}
