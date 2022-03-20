import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { SuperUserGuard } from '../roles/guards/superuser.guard';
import { ConfigService } from './config.service';
import { ConfigInput } from './dto/config.input';

@Controller('config')
export class ConfigController {
  constructor (private configService: ConfigService) {}

  @Public()
  @Get('/public')
  findPublic() {
    return this.configService.findPublic()
  }

  @UseGuards(SuperUserGuard)
  @Get()
  find() {
    return this.configService.find()
  }

  @UseGuards(SuperUserGuard)
  @Patch(':key')
  update(@Body() body: ConfigInput) {
    return this.configService.update(body)
  }

  @UseGuards(SuperUserGuard)
  @Delete(':key')
  delete(@Param('key') key: string) {
    return this.configService.delate(key)
  }

  @UseGuards(SuperUserGuard)
  @Post(':key')
  create(@Body() body: ConfigInput) {
    return this.configService.update(body)
  }
}
