import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Permissions, core } from 'unicore-api/server'

@Controller('mod/demo')
export class DemoUploadController {
  @Permissions(['mod.demo.write'])
  @Post('screenshot')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: { originalname: string; buffer: Buffer }) {
    const name = await core().storage.save(file.originalname, file.buffer)

    return { url: core().storage.url(name) }
  }
}
