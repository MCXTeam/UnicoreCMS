import { Audit, IpAddress } from '@common';
import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { assertServerScope } from 'src/admin/roles/server-scope';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { Server } from '../servers/entities/server.entity';
import { ServerInstance } from '../servers/entities/server-instance.entity';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { PunishmentCase, PunishmentProviderState } from './entities/punishment.entity';
import { PunishmentGroup, PunishmentSettings } from './entities/punishment-group.entity';
import { PunishmentPurchase } from './entities/punishment-purchase.entity';
import { PunishmentAccess } from './punishment-access.service';
import { PunishmentAdmin } from './punishment-admin.service';
import { PunishmentGroupsService } from './punishment-groups.service';
import { PunishmentPurchasesService } from './punishment-purchases.service';
import { PunishmentViews } from './punishment-views.service';
import { lockPunishments, punishmentAudit } from './punishment.model';
import { scopeCapabilities } from './punishment-capabilities';
import { PunishmentBindingInput, PunishmentConversionInput, PunishmentGroupInput, PunishmentInstanceInput, PunishmentIssueInput, PunishmentListInput, PunishmentPurchaseInput, PunishmentPurchaseResolutionInput, PunishmentRevisionInput, PunishmentSaleInput, PunishmentServerRuleInput, PunishmentSettingsInput, PunishmentTransferInput, PunishmentVerificationInput } from './dto/punishment-management.input';

@Public()
@Controller('punishments/public')
export class PunishmentPublicController {
  constructor(private views: PunishmentViews, private dataSource: DataSource) {}
  @Get()
  list(@Query() query: PunishmentListInput) { return this.views.list({ ...query, kind: 'BAN' }); }

  @Get('player/:username')
  async player(@Param('username') username: string, @Query() query: PunishmentListInput) {
    const user = await this.dataSource.getRepository(User).findOneBy({ username });
    if (!user) throw new NotFoundException();
    return this.views.list({ ...query, subjectUuid: user.uuid, kind: 'BAN' });
  }
}

@Controller('cabinet/punishments')
export class PunishmentPlayerController {
  constructor(private views: PunishmentViews, private purchases: PunishmentPurchasesService) {}
  @Get()
  mine(@Req() request: Request, @Query() query: PunishmentListInput) { return this.views.mine(request, query); }

  @Permissions(['player.unban.buy'])
  @Audit({ action: 'punishment.purchase', target: 'punishment', param: 'id' })
  @Post(':id/purchase')
  buy(@CurrentUser() user: User, @Param('id') id: string, @Body() input: PunishmentPurchaseInput, @IpAddress() ip: string) {
    return this.purchases.buy(user.uuid, id, input.requestId, input.revision, ip, input.quotedPrice);
  }
}

@Permissions(['panel.access'])
@Controller('punishments/admin')
export class PunishmentAdminController {
  constructor(private dataSource: DataSource, private views: PunishmentViews, private access: PunishmentAccess, private admin: PunishmentAdmin, private groups: PunishmentGroupsService, private purchases: PunishmentPurchasesService) {}

  @Get()
  list(@Req() request: Request, @Query() query: PunishmentListInput) { return this.views.list({ ...query, kind: query.kind || 'ALL' }, request, true); }

  @Get('options')
  async options(@Req() request: Request) {
    const [groups, instances, providers, servers, serverInstances] = await Promise.all([
      this.groups.list(), this.dataSource.getRepository(ConnectInstance).find({ order: { serverId: 'ASC' } }), this.dataSource.getRepository(PunishmentProviderState).find(),
      this.dataSource.getRepository(Server).find(), this.dataSource.getRepository(ServerInstance).find(),
    ]);
    const scopes: { type: string; id: string | null; name: string; issue: boolean; read: boolean; issueKinds: string[]; timedKinds: string[]; permanentKinds: string[] }[] = [];
    for (const area of [
      { type: 'PROJECT', id: null, name: '' },
      ...groups.map((group) => ({ type: 'GROUP', id: group.id, name: group.name })),
      ...servers.map((server) => ({ type: 'SERVER', id: server.id, name: server.name })),
      ...instances.filter((instance) => !instance.retired).map((instance) => ({ type: 'INSTANCE', id: instance.id, name: instance.displayName || `${servers.find((server) => server.id === instance.serverId)?.name || instance.serverId} · ${instance.instanceId.slice(0,8)}` })),
    ]) {
      const item = this.dataSource.manager.create(PunishmentCase, { category: 'GAME', scopeType: area.type, scopeId: area.id });
      const issue = await this.access.allows(request, 'issue', item);
      const read = await this.access.allows(request, 'read', item);
      const capabilities = scopeCapabilities(area, providers, instances, groups);
      if (issue || read) scopes.push({ ...area, issue: issue && capabilities.issueKinds.length > 0, read, ...capabilities });
    }
    const canManageGroups = await matchPermission(['panel.punishments.groups'], request);
    const canManageSettings = await matchPermission(['panel.punishments.settings'], request);
    const settings = canManageSettings ? await this.dataSource.getRepository(PunishmentSettings).findOneBy({ id: 'global' }) : null;
    const instanceOptions = await Promise.all(instances.map(async ({ id, serverId, instanceId, displayName, serverInstanceId, retired }) => ({ id, serverId, instanceId, displayName, serverInstanceId, retired, canEdit: await matchPermission([`panel.servers.update.${serverId}`], request) })));
    return { groups, instances: instanceOptions, providers, servers: servers.map(({ id, name }) => ({ id, name })), serverInstances: serverInstances.map(({ id, serverId, name, host, port }) => ({ id, serverId, name, host, port })), scopes, canManageGroups, canManageSettings, settings };
  }

  @Get('players')
  async players(@Query('search') search = '') {
    if (!search.trim()) return [];
    return this.dataSource.getRepository(User).createQueryBuilder('user').select(['user.uuid', 'user.username'])
      .where('user.username LIKE :search', { search: `%${search.trim().slice(0,128)}%` }).orderBy('user.username', 'ASC').take(20).getMany();
  }

  @Permissions(['panel.access', 'panel.punishments.groups'])
  @Audit({ action: 'punishment.group.save', bodyParam: 'id' })
  @Put('groups')
  saveGroup(@CurrentUser() user: User, @Body() input: PunishmentGroupInput) { return this.groups.save(input, user.uuid); }

  @Permissions(['panel.access', 'panel.punishments.groups'])
  @Post('groups/:id/remove')
  removeGroup(@CurrentUser() user: User, @Param('id') id: string, @Body() input: PunishmentRevisionInput) { return this.groups.remove(id, input.revision, user.uuid, true); }

  @Permissions(['panel.access', 'panel.punishments.settings'])
  @Put('settings')
  settings(@CurrentUser() user: User, @Body() input: PunishmentSettingsInput) {
    return this.dataSource.transaction(async (manager) => {
      const settings = await lockPunishments(manager);
      Object.assign(settings, input);
      await manager.save(settings);
      await punishmentAudit(manager, 'settings.updated', null, user.uuid, input as any);
      return settings;
    });
  }

  @Permissions(['panel.access', 'panel.punishments.settings'])
  @Put('settings/server')
  serverRule(@CurrentUser() user: User, @Body() input: PunishmentServerRuleInput) {
    return this.dataSource.transaction(async (manager) => {
      const settings = await lockPunishments(manager);
      if (!(await manager.exists(Server, { where: { id: input.serverId } }))) throw new NotFoundException();
      settings.servers = { ...settings.servers, [input.serverId]: { enabled: input.enabled ?? null, price: input.price ?? null } };
      await manager.save(settings);
      await punishmentAudit(manager, 'server.rule.updated', null, user.uuid, input as any);
      return settings;
    });
  }

  @Permissions(['panel.access', 'panel.servers.update.*'])
  @Patch('instances/:id')
  async instance(@Req() request: Request, @Param('id') id: string, @Body() input: PunishmentInstanceInput) {
    const instance = await this.dataSource.getRepository(ConnectInstance).findOneBy({ id });
    if (!instance) throw new NotFoundException();
    await assertServerScope(request, 'panel.servers.update', [instance.serverId]);
    if (input.serverInstanceId && !(await this.dataSource.getRepository(ServerInstance).existsBy({ id: input.serverInstanceId, serverId: instance.serverId }))) throw new BadRequestException('Выберите адрес этого сервера CMS');
    instance.displayName = input.displayName.trim() || null; instance.serverInstanceId = input.serverInstanceId || null;
    return this.dataSource.getRepository(ConnectInstance).save(instance);
  }

  @Post('issue')
  issue(@Req() request: Request, @Body() input: PunishmentIssueInput) { return this.admin.issue(request, input); }

  @Get('cases/:id')
  details(@Req() request: Request, @Param('id') id: string) { return this.admin.details(request, id); }

  @Post('cases/:id/revoke')
  revoke(@Req() request: Request, @Param('id') id: string, @Body() input: PunishmentRevisionInput) { return this.admin.revoke(request, id, input.revision); }

  @Patch('cases/:id/sale')
  sale(@Req() request: Request, @Param('id') id: string, @Body() input: PunishmentSaleInput) { return this.admin.sale(request, id, input); }

  @Post('cases/:id/transfer')
  transfer(@Req() request: Request, @Param('id') id: string, @Body() input: PunishmentTransferInput) { return this.admin.transfer(request, id, input); }

  @Post('cases/:id/convert-account')
  convert(@Req() request: Request, @Param('id') id: string, @Body() input: PunishmentConversionInput) { return this.admin.convertAccount(request, id, input.revision, input, input.confirm); }

  @Post('cases/:id/retry')
  retry(@Req() request: Request, @Param('id') id: string, @Body() input: PunishmentBindingInput) { return this.admin.retry(request, id, input.bindingId); }

  @Post('cases/:id/verify')
  verify(@Req() request: Request, @Param('id') id: string, @Body() input: PunishmentVerificationInput) { return this.admin.verify(request, id, input.bindingId, input.externalId, input.reason); }

  @Get('purchases')
  purchaseList(@Req() request: Request, @Query() query: PunishmentListInput) { return this.views.purchaseList(query, request); }

  @Post('purchases/:id/resolve')
  async resolve(@Req() request: Request, @CurrentUser() user: User, @Param('id') id: string, @Body() input: PunishmentPurchaseResolutionInput) {
    const purchase = await this.dataSource.getRepository(PunishmentPurchase).findOneBy({ id });
    if (!purchase) throw new NotFoundException();
    const item = await this.dataSource.getRepository(PunishmentCase).findOneByOrFail({ id: purchase.caseId });
    await this.access.assert(request, 'purchases', item);
    return this.purchases.resolve(id, input.action, input.reason, user.uuid);
  }
}
