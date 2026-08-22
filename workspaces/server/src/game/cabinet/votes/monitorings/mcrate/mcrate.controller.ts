import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { McrateCallbackInput } from './dto/mcrate-callback.input';
import { McrateService } from './mcrate.service';

@Controller('monitorings/mcrate')
export class McrateController {
  constructor(private mcrateService: McrateService) {}

  @Public()
  @Get()
  handler(@Query() body: McrateCallbackInput) {
    return this.mcrateService.handler(body);
  }
}
