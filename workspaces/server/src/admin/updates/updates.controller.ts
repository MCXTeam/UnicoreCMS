import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Audit } from '@common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { UpdatesService } from './updates.service';
import { UpdatesInput } from './updates.input';
import { UpdatesSetupService } from './updates-setup.service';

@Controller('admin/updates')
@Permissions(['panel.access', 'panel.updates.read'])
export class UpdatesController {
  constructor(private readonly service: UpdatesService, private readonly setup: UpdatesSetupService) {}

  @Get() status() {
    return this.service.request('/status');
  }
  @Get('releases') releases() {
    return this.service.request('/releases');
  }
  @Get('setup') discover() {
    return this.setup.discover();
  }

  @Post('setup')
  @Permissions(['panel.access', 'panel.updates.read', 'panel.updates.setup'])
  @Audit({ action: 'update.setup' })
  connect() {
    return this.setup.connect();
  }
  @Get('diff') diff(@Query('id') id: string, @Query('path') path: string) {
    return this.service.request(`/diff?${new URLSearchParams({ id, path })}`);
  }

  @Post('apply')
  @Permissions(['panel.access', 'panel.updates.read', 'panel.updates.apply'])
  @Audit({ action: 'update.apply', meta: ['id', 'hash'] })
  apply(@Body() input: UpdatesInput, @Req() request: any) {
    return this.job('apply', input, request);
  }

  @Post('recover')
  @Permissions(['panel.access', 'panel.updates.read', 'panel.updates.recover'])
  @Audit({ action: 'update.recover', meta: ['id'] })
  recover(@Body() input: UpdatesInput, @Req() request: any) {
    return this.job('recover', input, request);
  }

  @Post(':action')
  @Permissions(['panel.access', 'panel.updates.read', 'panel.updates.prepare'])
  @Audit({ action: 'update.prepare', meta: ['id', 'release'] })
  prepare(@Param('action') action: string, @Body() input: UpdatesInput, @Req() request: any) {
    if (!['adopt', 'plan', 'resolve', 'disable', 'artifacts', 'verify', 'cancel'].includes(action))
      throw new BadRequestException('updates.invalid_action');
    return this.job(action, input, request);
  }

  private job(action: string, input: UpdatesInput, request: any) {
    return this.service.request('/jobs', {
      action,
      input: { ...input },
      actor: String(request.user?.uuid || request.user?.id || 'unknown'),
    });
  }
}
