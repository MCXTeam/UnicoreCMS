import { Controller, Get } from '@nestjs/common';
import { VotesService } from './votes.service';

@Controller('cabinet/votes')
export class VotesController {
  constructor (private votesService: VotesService) {}

  @Get('monitorings')
  find() {
    return this.votesService.getMonitorings()
  }
}
