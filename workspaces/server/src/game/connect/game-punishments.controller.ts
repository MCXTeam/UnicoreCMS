import { Body, Controller, Get, Post, Req, Param, ParseUUIDPipe } from '@nestjs/common';
import { Request } from 'express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { connectToken } from './connect.controller';
import { GamePunishmentsService } from './game-punishments.service';
import { PunishmentAckInput, PunishmentCommandInput, PunishmentEventsInput, PunishmentPollInput } from './dto/punishment.input';

@Controller()
export class GamePunishmentsController {
  constructor(private punishments: GamePunishmentsService) {}

  @Permissions(['kernel.connect'])
  @Post('connect/v2/punishments/events')
  events(@Body() input: PunishmentEventsInput, @Req() request: Request) {
    return this.punishments.events(input, connectToken(request, input.serverId));
  }

  @Permissions(['kernel.connect'])
  @Post('connect/v2/punishments/poll')
  poll(@Body() input: PunishmentPollInput, @Req() request: Request) {
    return this.punishments.poll(input, connectToken(request, input.serverId));
  }

  @Permissions(['kernel.connect'])
  @Post('connect/v2/punishments/ack')
  acknowledge(@Body() input: PunishmentAckInput, @Req() request: Request) {
    return this.punishments.acknowledge(input, connectToken(request, input.serverId));
  }

  @Permissions([['panel.punishments.issue.*', 'panel.punishments.revoke.*'], { or: true }])
  @Post('game-punishments/commands')
  enqueue(@CurrentUser() user: User, @Body() input: PunishmentCommandInput) {
    return this.punishments.enqueue(user, input);
  }

  @Permissions([['panel.punishments.read.*', 'panel.punishments.issue.*', 'panel.punishments.revoke.*'], { or: true }])
  @Get('game-punishments/commands/:id')
  command(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.punishments.command(id, user);
  }

  @Get('cabinet/game-punishments/me')
  mine(@CurrentUser() user: User) {
    return this.punishments.forPlayer(user.uuid);
  }
}
