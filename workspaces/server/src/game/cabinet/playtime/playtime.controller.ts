import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { PlaytimeDto } from './dto/playtime.dto';
import { PlaytimeInput } from './dto/playtime.input';
import { PlaytimeService } from './playtime.service';

@Controller('cabinet/playtime')
export class PlaytimeController {
  constructor(private playtimeService: PlaytimeService) {}

  @Get('me')
  async me(@CurrentUser() user: User) {
    return (await this.playtimeService.findOneByUser(user)).map(pt => instanceToPlain(new PlaytimeDto(pt)));
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Patch()
  update(@Body() body: PlaytimeInput[]) {
    return this.playtimeService.update(body);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Get('user/:server/:uuid')
  async findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.playtimeService.findOneByUserAndServer(server, uuid);
  }
}
