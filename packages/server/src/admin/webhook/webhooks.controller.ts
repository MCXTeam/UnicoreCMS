import { DeleteManyInput } from "@common";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { WebhookInput } from "./dto/webhook.input";
import { WebhooksService } from "./webhooks.service";

@Controller('admin/webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  find() {
    return this.webhooksService.find();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.findOne(id);
  }

  @Post()
  create(@Body() body: WebhookInput) {
    return this.webhooksService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: WebhookInput) {
    return this.webhooksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.remove(id);
  }

  @Delete('bulk/:any')
  removeMany(@Body() body: DeleteManyInput) {
    return this.webhooksService.removeMany(body.items);
  }
}
