import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { OnlineService } from './online.service';

@Controller('servers/online')
export class OnlineController {
  constructor (
    private onlineService: OnlineService
  ) {}

  @Public()
  @Get()
  find() {
    return this.onlineService.find()
  }
}
