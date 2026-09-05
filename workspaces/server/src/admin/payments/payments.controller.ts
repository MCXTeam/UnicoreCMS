import { Audit, Paginate, PaginateQuery } from '@common';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { PaymentCreateInput } from './dto/payment-create.input';
import { PaymentUpdateInput } from './dto/payment-update.input';
import { PaymentsService } from './payments.service';

@Permissions(['panel.access', 'panel.revenue.access', 'panel.revenue.payments'])
@Controller('admin/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  find(@Paginate() query: PaginateQuery) {
    return this.paymentsService.find(query);
  }

  @Get('top')
  top() {
    return this.paymentsService.top();
  }

  @Permissions(['panel.access', 'panel.revenue.payments.create'])
  @Get('players')
  players(@Query('search') search?: string) {
    return this.paymentsService.players(search);
  }

  @Permissions(['panel.access', 'panel.revenue.payments.create'])
  @Audit({ action: 'payment.manual', target: 'user', bodyParam: 'username', meta: ['amount', 'method', 'paid'] })
  @Post()
  create(@Body() body: PaymentCreateInput) {
    return this.paymentsService.create(body);
  }

  @Permissions(['panel.access', 'panel.revenue.payments.create'])
  @Audit({ action: 'payment.manual', target: 'payment', param: 'id', meta: ['amount', 'status'] })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: PaymentUpdateInput) {
    return this.paymentsService.update(id, body);
  }
}
