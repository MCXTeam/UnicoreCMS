import { Body, Controller, Post } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { VoteCallbackInput } from '../core/dto/vote-callback.input';
import { TopcraftService } from './topcraft.service';

@Controller('monitorings/topcraft')
export class TopcraftController {
  constructor(private topcraftService: TopcraftService) {}

  @Public()
  @Post()
  handler(@Body() body: VoteCallbackInput) {
    return this.topcraftService.handler(body);
  }
}
