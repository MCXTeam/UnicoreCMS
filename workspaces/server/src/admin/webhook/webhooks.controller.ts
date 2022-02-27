import { DeleteManyInput } from '@common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { WebhookInput } from './dto/webhook.input';
import { WebhookMapper } from './mappers/webhook.mapper';
import { WebhooksService } from './webhooks.service';

@Controller('admin')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get('webhooks-list')
  list() {
    return WebhookMapper;
  }

  @Get('webhooks')
  find() {
    return this.webhooksService.find();
  }

  @Get('webhooks/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.findOne(id);
  }

  @Post('webhooks')
  create(@Body() body: WebhookInput) {
    return this.webhooksService.create(body);
  }

  @Patch('webhooks/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: WebhookInput) {
    return this.webhooksService.update(id, body);
  }

  @Delete('webhooks/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.remove(id);
  }

  @Delete('webhooks/bulk/:any')
  removeMany(@Body() body: DeleteManyInput) {
    return this.webhooksService.removeMany(body.items);
  }
}
