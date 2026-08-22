import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { MctopCallbackInput } from './dto/mctop-callback.input';
import { MctopService } from './mctop.service';

@Controller('monitorings/mctop')
export class MctopController {
  constructor(private mctopService: MctopService) {}

  @Public()
  @Get()
  handler(@Query() body: MctopCallbackInput) {
    return this.mctopService.handler(body);
  }
}
