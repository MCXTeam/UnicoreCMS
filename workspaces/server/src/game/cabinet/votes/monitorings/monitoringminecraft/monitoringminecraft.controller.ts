import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { VoteCallbackInput } from '../core/dto/vote-callback.input';
import { MonitoringminecraftService } from './monitoringminecraft.service';

@Controller('monitorings/monitoringminecraft')
export class MonitoringminecraftController {
  constructor(private mmService: MonitoringminecraftService) {}

  @Public()
  @Get()
  handler(@Query() body: VoteCallbackInput) {
    return this.mmService.handler(body);
  }
}
