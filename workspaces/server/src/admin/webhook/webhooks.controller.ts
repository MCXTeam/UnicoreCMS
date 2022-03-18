import { DeleteManyInput } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Permission } from 'unicore-common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { WebhookInput } from './dto/webhook.input';
import { WebhookMapper } from './mappers/webhook.mapper';
import { WebhooksService } from './webhooks.service';

@Permissions([Permission.AdminDashboard])
@Controller('admin')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Permissions([Permission.AdminWebhooksRead])
  @Get('webhooks-list')
  list() {
    return WebhookMapper;
  }

  @Permissions([Permission.AdminWebhooksRead])
  @Get('webhooks')
  find() {
    return this.webhooksService.find();
  }

  @Permissions([Permission.AdminWebhooksRead])
  @Get('webhooks/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.findOne(id);
  }

  @Permissions([Permission.AdminWebhooksCreate])
  @Post('webhooks')
  create(@Body() body: WebhookInput) {
    return this.webhooksService.create(body);
  }

  @Permissions([Permission.AdminWebhooksUpdate])
  @Patch('webhooks/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: WebhookInput) {
    return this.webhooksService.update(id, body);
  }

  @Permissions([Permission.AdminWebhooksDelete])
  @Delete('webhooks/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.remove(id);
  }

  @Permissions([Permission.AdminWebhooksDeleteMany])
  @Delete('webhooks/bulk/:any')
  removeMany(@Body() body: DeleteManyInput) {
    return this.webhooksService.removeMany(body.items);
  }
}
