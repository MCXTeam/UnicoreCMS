import { BadRequestException, Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentUser, IpAddress, Public, core } from 'unicore-api/server'
import type { UserRecord } from 'unicore-api'
import { UPLOADS_PER_HOUR } from '../shared/constants'
import { SubmitInput } from './dto/submit.input'
import { FormsService } from './forms.service'

const MEGABYTE = 1024 * 1024
const HOUR_SECONDS = 60 * 60

@Controller('mod/forms')
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Public()
  @Get()
  catalog() {
    return this.forms.catalog()
  }

  @Public()
  @Get('nav')
  nav() {
    return this.forms.navList()
  }

  @Get('my')
  mine(@CurrentUser() user: UserRecord) {
    return this.forms.mine(user.uuid)
  }

  @Public()
  @Get(':slug')
  open(@Param('slug') slug: string, @CurrentUser() user: UserRecord, @IpAddress() ip: string) {
    return this.forms.open(slug, user || null, ip)
  }

  @Public()
  @Post(':slug/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('slug') slug: string,
    @CurrentUser() user: UserRecord,
    @IpAddress() ip: string,
    @UploadedFile() file: { originalname: string; buffer: Buffer; size: number },
  ) {
    if (!file) throw new BadRequestException('Файл не пришёл')

    const limit = await this.forms.maxFileSize(slug, user || null, ip)

    await this.throttle(ip)

    if (file.size > limit * MEGABYTE) throw new BadRequestException(`Файл больше ${limit} МБ`)

    const name = await core().storage.save(file.originalname, file.buffer)

    return { url: core().storage.url(name) }
  }

  @Public()
  @Post(':slug')
  submit(
    @Param('slug') slug: string,
    @Body() input: SubmitInput,
    @CurrentUser() user: UserRecord,
    @IpAddress() ip: string,
  ) {
    return this.forms.submit(slug, input, user || null, ip)
  }

  private async throttle(ip: string): Promise<void> {
    const key = `mod.forms.upload.${ip}`
    const used = (await core().cache.get<number>(key)) || 0

    if (used >= UPLOADS_PER_HOUR) throw new BadRequestException('Слишком много файлов за час, попробуйте позже')

    await core().cache.set(key, used + 1, HOUR_SECONDS)
  }
}
