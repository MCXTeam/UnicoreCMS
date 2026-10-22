import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'node:crypto';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { assertServerScope } from 'src/admin/roles/server-scope';
import { ApiToken } from 'src/admin/api/entities/api-token.entity';
import { ConnectIdentityInput, PresenceInput, SessionsInput } from './dto/connect.input';
import { ConnectIdentityService } from './connect-identity.service';
import { ConnectPresenceService } from './connect-presence.service';
import { ConnectSessionsService } from './connect-sessions.service';

export function connectToken(request: Request & { apiToken?: ApiToken }, serverId: string): string {
  if (!request.apiToken) throw new ForbiddenException('Connect requires an API token');
  if (request.apiToken.servers?.length && !request.apiToken.servers.includes(serverId))
    throw new ForbiddenException('Server is outside API token scope');
  return createHash('sha256').update(request.apiToken.secret).digest('hex');
}

@Controller('connect/v2')
export class ConnectController {
  constructor(
    private identity: ConnectIdentityService,
    private presence: ConnectPresenceService,
    private sessions: ConnectSessionsService,
  ) {}

  @Permissions(['panel.servers.read'])
  @Get('instances/:serverId')
  diagnostics(@Param('serverId') serverId: string) {
    return this.identity.diagnostics(serverId);
  }

  @Permissions(['panel.servers.update.*'])
  @Post('instances/:id/retire')
  retire(@Param('id') id: string, @Req() request: Request) {
    return this.identity.retire(id, (serverId) => assertServerScope(request, 'panel.servers.update', [serverId]));
  }

  @Permissions(['kernel.connect'])
  @Post('register')
  register(@Body() input: ConnectIdentityInput, @Req() request: Request) {
    return this.identity.register(input, connectToken(request, input.serverId));
  }

  @Permissions(['kernel.connect'])
  @Post('presence')
  updatePresence(@Body() input: PresenceInput, @Req() request: Request) {
    return this.presence.update(input, connectToken(request, input.serverId));
  }

  @Permissions(['kernel.connect'])
  @Post('sessions')
  updateSessions(@Body() input: SessionsInput, @Req() request: Request) {
    return this.sessions.update(input, connectToken(request, input.serverId));
  }
}
