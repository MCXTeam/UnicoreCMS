import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { LAUNCHER_NEWS_LIMIT } from '@common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { LaminaraAuthenticateInput } from './dto/laminara-authenticate.input';
import { LaminaraService } from './laminara.service';

@Permissions(['kernel.laminara.provider'])
@Controller('auth/laminara')
export class LaminaraController {
  constructor(private laminaraService: LaminaraService) {}

  @Get('ping')
  ping() {
    return this.laminaraService.ping();
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  authenticate(@Body() input: LaminaraAuthenticateInput) {
    return this.laminaraService.authenticate(input);
  }

  @Get('user')
  user(@Query('username') username?: string, @Query('uuid') uuid?: string) {
    if (Boolean(username) === Boolean(uuid)) throw new BadRequestException('Передайте ровно один параметр: username или uuid');

    return username ? this.laminaraService.byUsername(username) : this.laminaraService.byUuid(uuid);
  }

  @Get('news')
  news(@Query('limit', new DefaultValuePipe(LAUNCHER_NEWS_LIMIT), ParseIntPipe) limit: number) {
    return this.laminaraService.news(limit);
  }
}
