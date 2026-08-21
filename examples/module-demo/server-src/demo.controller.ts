import { Body, Controller, Get, Post } from '@nestjs/common'
import { CurrentUser, Permissions, Public } from 'unicore-api/server'
import { DemoService } from './demo.service'

@Controller('mod/demo')
export class DemoController {
  constructor(private readonly service: DemoService) {}

  @Public()
  @Get('notes')
  list() {
    return this.service.list()
  }

  @Permissions(['mod.demo.write'])
  @Post('notes')
  create(@CurrentUser() user: { uuid?: string } | undefined, @Body() body: { text?: string }) {
    return this.service.create(user?.uuid || null, String(body?.text || '').slice(0, 500))
  }
}
