import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { CurrentUser, Permissions, core } from 'unicore-api/server'
import type { UserRecord } from 'unicore-api'
import { FORM_PRESETS } from '../shared/presets'
import { FormCreateInput, FormInput } from './dto/form.input'
import { ReviewInput } from './dto/submit.input'
import { FormsService } from './forms.service'

@Controller('mod/forms/manage')
export class FormsAdminController {
  constructor(private readonly forms: FormsService) {}

  @Permissions(['mod.forms.read'])
  @Get('presets')
  presets() {
    return FORM_PRESETS.map(({ fields, ...preset }) => ({ ...preset, fields: fields.length }))
  }

  @Permissions(['mod.forms.read'])
  @Get('channels')
  channels() {
    return core().webhooks.channels()
  }

  @Permissions(['mod.forms.read'])
  @Get('submissions')
  submissions(@Query('form') form?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.forms.inbox({ form: form ? Number(form) : undefined, status: status || undefined, page: page ? Number(page) : 1 })
  }

  @Permissions(['mod.forms.review'])
  @Patch('submissions/:id')
  review(@Param('id', ParseIntPipe) id: number, @Body() input: ReviewInput, @CurrentUser() user: UserRecord) {
    return this.forms.review(id, input, user)
  }

  @Permissions(['mod.forms.review'])
  @Delete('submissions/:id')
  removeSubmission(@Param('id', ParseIntPipe) id: number) {
    return this.forms.removeSubmission(id)
  }

  @Permissions(['mod.forms.read'])
  @Get()
  list() {
    return this.forms.list()
  }

  @Permissions(['mod.forms.write'])
  @Post()
  create(@Body() input: FormCreateInput) {
    return this.forms.create(input)
  }

  @Permissions(['mod.forms.read'])
  @Get(':id')
  one(@Param('id', ParseIntPipe) id: number) {
    return this.forms.one(id)
  }

  @Permissions(['mod.forms.write'])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() input: FormInput) {
    return this.forms.update(id, input)
  }

  @Permissions(['mod.forms.write'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.forms.remove(id)
  }
}
