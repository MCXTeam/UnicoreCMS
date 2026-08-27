import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { assertServerPermission } from 'src/admin/roles/guards/permisson.guard';
import { RconRunInput } from '../dto/rcon-run.input';
import { RconQueueService } from './rcon-queue.service';
import { RconService } from './rcon.service';

@Controller('rcon')
export class RconController {
  constructor(private rconService: RconService, private rconQueueService: RconQueueService) {}

  @Permissions(['panel.access', 'panel.servers.rcon.*'])
  @Post(':server/test')
  async test(@Req() request: any, @Param('server') server: string) {
    await assertServerPermission(request, 'panel.servers.rcon', server);

    return this.rconService.test(server);
  }

  @Permissions(['panel.access', 'panel.servers.rcon.*'])
  @Post(':server/run')
  async run(@Req() request: any, @Param('server') server: string, @Body() body: RconRunInput) {
    await assertServerPermission(request, 'panel.servers.rcon', server);

    return this.rconService.sendCommand(server, body.command);
  }

  @Permissions(['panel.access', 'panel.servers.rcon.*'])
  @Get(':server/queue')
  async queue(@Req() request: any, @Param('server') server: string) {
    await assertServerPermission(request, 'panel.servers.rcon', server);

    return this.rconQueueService.listByServer(server);
  }

  @Permissions(['panel.access', 'panel.servers.rcon.*'])
  @Post(':server/retry')
  async retry(@Req() request: any, @Param('server') server: string) {
    await assertServerPermission(request, 'panel.servers.rcon', server);

    return this.rconQueueService.retryFailed(server);
  }
}
