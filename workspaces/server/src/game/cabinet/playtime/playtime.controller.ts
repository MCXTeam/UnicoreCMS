import { Body, Controller, Get, Param, ParseArrayPipe, Patch } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PlaytimeDto } from './dto/playtime.dto';
import { PlaytimeInput } from './dto/playtime.input';
import { PlaytimeService } from './playtime.service';

@Controller('cabinet/playtime')
export class PlaytimeController {
  constructor(private playtimeService: PlaytimeService) {}

  @Get('me')
  async me(@CurrentUser() user: User) {
    return (await this.playtimeService.findOneByUser(user)).map((pt) => instanceToPlain(new PlaytimeDto(pt)));
  }

  @Permissions(['kernel.connect'])
  @Patch()
  update(@Body(new ParseArrayPipe({ items: PlaytimeInput, whitelist: true })) body: PlaytimeInput[]) {
    return this.playtimeService.update(body);
  }

  @Permissions(['kernel.connect'])
  @Get('user/:server/:uuid')
  async findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.playtimeService.findOneByUserAndServer(server, uuid);
  }

  @Permissions(['kernel.connect'])
  @Get('top/:server')
  async findTopByServer(@Param('server') server: string) {
    return this.playtimeService.findTopByServer(server);
  }
}
