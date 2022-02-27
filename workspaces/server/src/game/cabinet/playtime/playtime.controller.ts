import { Controller, Get } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PlaytimeService } from './playtime.service';

@Controller('cabinet/playtime')
export class PlaytimeController {
  constructor(private playtimeService: PlaytimeService) { }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.playtimeService.findOneByUser(user)
  }
}
