import { Audit, DeleteManyInput } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { WebhookInput } from './dto/webhook.input';
import { WebhookMapper } from './mappers/webhook.mapper';
import { WebhooksService } from './webhooks.service';

@Permissions(['panel.access'])
@Controller('admin')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Permissions(['panel.webhooks.read'])
  @Get('webhooks-list')
  list() {
    return WebhookMapper;
  }

  @Permissions(['panel.webhooks.read'])
  @Get('webhooks')
  find() {
    return this.webhooksService.find();
  }

  @Permissions(['panel.webhooks.delete.many'])
  @Audit({ action: 'webhook.delete' })
  @Delete('webhooks/bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.webhooksService.removeMany(body.items);
  }

  @Permissions(['panel.webhooks.read'])
  @Get('webhooks/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.findOne(id);
  }

  @Permissions(['panel.webhooks.create'])
  @Audit({ action: 'webhook.create', target: 'webhook', meta: ['event', 'request'] })
  @Post('webhooks')
  create(@Body() body: WebhookInput) {
    return this.webhooksService.create(body);
  }

  @Permissions(['panel.webhooks.update'])
  @Audit({ action: 'webhook.update', target: 'webhook', param: 'id' })
  @Patch('webhooks/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: WebhookInput) {
    return this.webhooksService.update(id, body);
  }

  @Permissions(['panel.webhooks.delete'])
  @Audit({ action: 'webhook.delete', target: 'webhook', param: 'id' })
  @Delete('webhooks/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.remove(id);
  }
}
