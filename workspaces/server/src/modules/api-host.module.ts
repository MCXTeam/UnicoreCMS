import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Global, Inject, Injectable, Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { API_VERSION, capabilities, events, setCore } from 'unicore-api';
import type { CoreApi, LoggerApi, StaffMember, UserRecord } from 'unicore-api';
import { formatError, stdout } from '@common';
import { StorageManager } from 'src/common/storage/storage.class';
import { ConfigService } from 'src/admin/config/config.service';
import { LocalesService } from 'src/admin/locales/locales.service';
import { UsersService } from 'src/admin/users/users.service';
import { User } from 'src/admin/users/entities/user.entity';
import { roleAppearanceRecord } from 'src/admin/roles/dto/role-appearance.dto';
import { IssuanceService } from 'src/game/servers/rcon/issuance.service';
import { RconService } from 'src/game/servers/rcon/rcon.service';
import { RconModule } from 'src/game/servers/rcon/rcon.module';
import { ServersService } from 'src/game/servers/servers.service';
import { ServersModule } from 'src/game/servers/servers.module';
import { MoneyService } from 'src/game/cabinet/money/money.service';
import { MoneyModule } from 'src/game/cabinet/money/money.module';
import { OnlineService } from 'src/game/servers/online/online.service';
import { OnlineModule } from 'src/game/servers/online/online.module';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentModule } from 'src/payment/payment.module';
import { PaymentHandlerService } from 'src/payment/methods/core/payment-handler.service';
import { PaymentHandlerModule } from 'src/payment/methods/core/payment-handler.module';
import { WebhookDeliveriesService } from 'src/admin/webhook/webhook-deliveries.service';
import { WebhooksModule } from 'src/admin/webhook/webhooks.module';
import { Webhook } from 'src/admin/webhook/entities/webhook.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigModule } from 'src/admin/config/config.module';
import UsersModule from 'src/admin/users/users.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { Role } from 'src/admin/roles/entities/role.entity';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { CORE_CAPABILITIES } from './capabilities';
import { moduleRuntime } from './runtime';

@Injectable()
export class ApiHostService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('Modules');

  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly localesService: LocalesService,
    private readonly issuanceService: IssuanceService,
    private readonly rconService: RconService,
    private readonly serversService: ServersService,
    private readonly moneyService: MoneyService,
    private readonly onlineService: OnlineService,
    private readonly paymentService: PaymentService,
    private readonly paymentHandler: PaymentHandlerService,
    private readonly webhookDeliveries: WebhookDeliveriesService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(UsersDonateGroup) private readonly userGroups: Repository<UsersDonateGroup>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    setCore(this.buildCore());
    capabilities().replace(CORE_CAPABILITIES);

    events().setErrorReporter((event, owner, error) => {
      this.logger.error(`[module:${owner || 'unknown'}] обработчик события ${event}: ${formatError(error)}`);
    });

    const runtime = moduleRuntime();

    for (const module of runtime.loaded) {
      const setup = module.contribution?.setup;

      if (!setup) continue;

      try {
        await setup(this.context(module.id));
      } catch (error) {
        this.logger.error(`[module:${module.id}] ошибка инициализации: ${formatError(error)}`);
      }
    }

    this.report(runtime);

    await events().emit('core.ready', { version: API_VERSION });
  }

  async onApplicationShutdown(): Promise<void> {
    if (!moduleRuntime().loaded.length) return;

    await events().emit('core.shutdown', {} as never);
  }

  private context(id: string) {
    return {
      id,
      events: events(),
      capabilities: capabilities(),
      logger: this.moduleLogger(id),
      core: () => this.buildCore(),
    };
  }

  private userRecord(user: User | null): UserRecord | null {
    if (!user) return null;

    return {
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      activated: Boolean(user.activated),
      superuser: Boolean(user.superuser),
      perms: user.perms || [],
      skin: user.skin ? { file: user.skin.file, slim: Boolean(user.skin.slim) } : null,
      cloak: user.cloak ? { file: user.cloak.file } : null,
      role: roleAppearanceRecord(user.roles),
    };
  }

  private async staffMembers(): Promise<StaffMember[]> {
    const [roles, granted] = await Promise.all([
      this.roles.find({ where: { staff: true }, relations: ['users'] }),
      this.userGroups.find({ where: [{ expired: IsNull() }, { expired: MoreThan(new Date()) }], relations: ['user'] }),
    ]);

    const members: StaffMember[] = [];

    for (const role of roles)
      for (const user of role.users || [])
        members.push({
          uuid: user.uuid,
          username: user.username,
          label: role.name,
          color: role.color ?? null,
          serverId: null,
          priority: role.priority ?? 0,
          skin: user.skin ? { file: user.skin.file, slim: Boolean(user.skin.slim) } : null,
          cloak: user.cloak ? { file: user.cloak.file } : null,
        });

    for (const row of granted)
      if (row.group?.staff && row.user && row.server)
        members.push({
          uuid: row.user.uuid,
          username: row.user.username,
          label: row.group.name,
          color: row.group.color ?? null,
          serverId: row.server.id,
          priority: row.group.priority ?? 0,
          skin: row.user.skin ? { file: row.user.skin.file, slim: Boolean(row.user.skin.slim) } : null,
          cloak: row.user.cloak ? { file: row.user.cloak.file } : null,
        });

    return members;
  }

  private moduleLogger(id: string): LoggerApi {
    const logger = new Logger(`module:${id}`);

    return {
      log: (message) => logger.log(message),
      warn: (message) => logger.warn(message),
      error: (message, error) => logger.error(error ? `${message}: ${formatError(error)}` : message),
      debug: (message) => logger.debug(message),
    };
  }

  private report(runtime: ReturnType<typeof moduleRuntime>): void {
    for (const module of runtime.loaded) stdout(`\tМодуль ${module.id} ${module.manifest.version} загружен`);
    for (const module of runtime.disabled) stdout(`\tМодуль ${module.id} выключен`);
    for (const failure of runtime.failures) this.logger.warn(`Модуль ${failure.id} не загружен: ${failure.reason}`);
  }

  private buildCore(): CoreApi {
    return {
      version: API_VERSION,
      users: {
        getById: async (uuid) => this.userRecord(await this.usersService.getById(uuid).catch(() => null)),
        getByUsername: async (username) => this.userRecord(await this.usersService.getByUsername(username).catch(() => null)),
        getByEmail: async (email) => this.userRecord(await this.usersService.getByEmail(email).catch(() => null)),
        search: async (query, limit) =>
          (await this.usersService.search(String(query || ''), limit).catch(() => [])).map((user) => this.userRecord(user)),
        perms: async (uuid) => {
          const user = (await this.usersService.getById(uuid, ['roles']).catch(() => null)) as { perms?: string[] } | null;

          return user?.perms || [];
        },
      },
      config: {
        get: async (key) => {
          const value = (await this.configService.load())[key];

          return value === undefined || value === null ? null : String(value);
        },
        getNumber: async (key, fallback = 0) => {
          const value = Number((await this.configService.load())[key]);

          return Number.isFinite(value) ? value : fallback;
        },
        getBoolean: async (key, fallback = false) => {
          const value = (await this.configService.load())[key];

          return value === undefined || value === null ? fallback : Boolean(value);
        },
        set: async (key, value) => {
          await this.configService.update({ key, value } as never);
        },
      },
      locales: {
        defaultCode: () => this.localesService.defaultCode(),
        enabled: async () => (await this.localesService.findEnabled()).map((locale) => locale.code),
        messages: (code) => this.localesService.messages(code),
      },
      issuance: {
        isRcon: async (server) => this.issuanceService.isRcon(server as never),
        deliverProduct: (user, server, product, amount) =>
          this.issuanceService.deliverProduct(user as never, server as never, product as never, amount),
        deliverGroup: (user, server, group, seconds = 0) =>
          this.issuanceService.deliverGroup(user as never, server as never, group as never, seconds),
        removeGroup: (user, server, group) => this.issuanceService.removeGroup(user as never, server as never, group as never),
        deliverPermission: (user, server, permission, seconds = 0) =>
          this.issuanceService.deliverPermission(user as never, server as never, permission as never, seconds),
        removePermission: (user, server, permission) =>
          this.issuanceService.removePermission(user as never, server as never, permission as never),
        runCommands: async (serverId, commands) => {
          await this.rconService.sendCommands(String(serverId), commands);
        },
      },
      staff: {
        members: () => this.staffMembers(),
      },
      servers: {
        all: async () => (await this.serversService.find()) as never,
        one: async (id) => ((await this.serversService.findOne(String(id)).catch(() => null)) || null) as never,
        online: async () => {
          const onlines = await this.onlineService.find();

          return onlines.servers.map((entry) => ({
            id: entry.serverId,
            online: Boolean(entry.online),
            players: Number(entry.players || 0),
            maxplayers: Number(entry.maxplayers || 0),
          }));
        },
      },
      money: {
        ingame: async (uuid, serverId) => Number((await this.moneyService.findOneByUserUuidAndServer(String(serverId), uuid))?.money || 0),
        giveIngame: async (uuid, serverId, amount) => {
          await this.moneyService.deposit({ user_uuid: uuid, server_id: String(serverId), amount } as never);
        },
        takeIngame: async (uuid, serverId, amount) => {
          await this.moneyService.withdraw({ user_uuid: uuid, server_id: String(serverId), amount } as never);
        },
        giveReal: async (uuid, amount) => {
          await this.dataSource.getRepository('unicore_users').increment({ uuid }, 'real', amount);
        },
        takeReal: async (uuid, amount) => {
          await this.dataSource.getRepository('unicore_users').decrement({ uuid }, 'real', amount);
        },
      },
      payments: {
        methods: () => this.paymentService.getMethods(),
        create: async (uuid, amount, method, ip = '') => {
          const user = await this.usersService.getById(uuid);

          if (!user) throw new Error(`Пользователь ${uuid} не найден`);

          return (await this.paymentHandler.create(method, amount, user as never, ip)).id;
        },
        complete: (paymentId, billId, reportedAmount) => this.paymentHandler.handler(paymentId, billId || null, reportedAmount),
        credit: async (uuid, amount, method, ip = '') => {
          const user = await this.usersService.getById(uuid);

          if (!user) throw new Error(`Пользователь ${uuid} не найден`);

          const payment = await this.paymentHandler.create(method, amount, user as never, ip);

          return this.paymentHandler.handler(payment.id);
        },
      },
      webhooks: {
        channels: () => this.webhookDeliveries.channelNames(),
        targets: async (channel) => {
          const targets = await this.webhookDeliveries.targets();

          return targets
            .filter((target) => !channel || target.request === channel)
            .map((target) => ({ id: target.id, name: target.name, channel: String(target.request) }));
        },
        send: (channel, post) =>
          this.webhookDeliveries.broadcast(channel, {
            title: post.title,
            text: post.description,
            url: post.url,
            image: post.image || undefined,
          }),
      },
      mail: {
        send: async (to, subject, html) => {
          await this.mailerService.sendMail({ to, subject, html });
        },
        sendToUser: async (uuid, subject, html) => {
          const user = await this.usersService.getById(uuid);

          if (!user?.email) throw new Error(`У пользователя ${uuid} нет email`);

          await this.mailerService.sendMail({ to: user.email, subject, html });
        },
      },
      storage: {
        url: (filename) => StorageManager.url(filename),
        save: async (filename, content) => StorageManager.save(filename, content),
        remove: async (filename) => StorageManager.remove(filename),
      },
      cache: {
        get: (key) => this.cacheManager.get(key),
        set: async (key, value, ttlSeconds) => {
          await this.cacheManager.set(key, value, ttlSeconds ? ttlSeconds * 1000 : undefined);
        },
        del: async (key) => {
          await this.cacheManager.del(key);
        },
      },
      db: this.dataSource,
      logger: (moduleId: string) => this.moduleLogger(moduleId),
    };
  }
}

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UsersDonateGroup]),
    UsersModule,
    ConfigModule,
    RconModule,
    ServersModule,
    MoneyModule,
    OnlineModule,
    PaymentModule,
    PaymentHandlerModule,
    WebhooksModule,
  ],
  providers: [ApiHostService],
  exports: [ApiHostService],
})
export class ApiHostModule {}
