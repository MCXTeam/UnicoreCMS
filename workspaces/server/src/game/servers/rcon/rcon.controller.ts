import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { RconRunInput } from '../dto/rcon-run.input';
import { RconQueueService } from './rcon-queue.service';
import { RconService } from './rcon.service';

@Controller('rcon')
export class RconController {
  constructor(
    private rconService: RconService,
    private rconQueueService: RconQueueService,
  ) {}

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Post(':server/test')
  test(@Param('server') server: string) {
    return this.rconService.test(server);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Post(':server/run')
  run(@Param('server') server: string, @Body() body: RconRunInput) {
    return this.rconService.sendCommand(server, body.command);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Get(':server/queue')
  queue(@Param('server') server: string) {
    return this.rconQueueService.listByServer(server);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminServersUpdate])
  @Post(':server/retry')
  retry(@Param('server') server: string) {
    return this.rconQueueService.retryFailed(server);
  }
}
