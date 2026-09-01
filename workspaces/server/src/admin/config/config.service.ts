import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DEFAULT_ISSUANCE_PRESET, RCON_PRESETS } from 'unicore-common';
import { ACTIVE_MODULES_KEY } from 'unicore-api';
import {
  CacheKey,
  GIFTS_CODE_EXPIRE_DAYS,
  GIFTS_DAILY_LIMIT,
  KEEP_HISTORY_DAYS,
  KEEP_PAID_PAYMENTS_DAYS,
  KEEP_PENDING_PAYMENTS_DAYS,
} from '@common';
import { IsNull, Repository } from 'typeorm';
import { ConfigField, ConfigType } from './config.enum';
import { enabledModuleIds, moduleConfigSchema } from 'src/modules/runtime';
import { configTypeOf, moduleConfigKey } from './module-config';
import { CONFIG_CACHE_TTL_MS } from './config.constants';
import { isValidConfigNumber } from './config.utils';
import { ConfigInput } from './dto/config.input';
import { Config } from './entities/config.entity';
import _ from 'lodash';

export type LoadedConfig = Record<string, string | number | boolean>;

@Injectable()
export class ConfigService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Config) private configRepo: Repository<Config>,
  ) {}

  private configTransformer(config: Config[]) {
    return config.map((cfg) => {
      if (!cfg.value) return cfg;
      else if (cfg.type == ConfigType.boolean) {
        if (cfg.value == 'false' || cfg.value == '0') return { ...cfg, value: false };
        else return { ...cfg, value: true };
      } else if (cfg.type == ConfigType.number) {
        return { ...cfg, value: Number(cfg.value) };
      } else {
        return cfg;
      }
    });
  }

  async init() {
    const presetOps = (RCON_PRESETS.find((p) => p.id === DEFAULT_ISSUANCE_PRESET) ?? RCON_PRESETS[0]).ops;
    const vanillaOps = (RCON_PRESETS.find((p) => p.id === 'vanilla') ?? RCON_PRESETS[0]).ops;

    await this.configRepo
      .createQueryBuilder()
      .insert()
      .into(Config)
      .values([
        {
          key: ConfigField.EconomyRate,
          value: '100',
          important: true,
          type: ConfigType.number,
        },
        { key: ConfigField.LauncherExe, important: true, type: ConfigType.string },
        { key: ConfigField.LauncherJar, important: true, type: ConfigType.string },
        { key: ConfigField.LinkForum, important: true, type: ConfigType.string, value: 'https://unicorecms.ru' },
        { key: ConfigField.LinkDiscord, important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
        { key: ConfigField.LinkTelegram, important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
        { key: ConfigField.LinkVk, important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
        { key: ConfigField.LinkYoutube, important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
        { key: ConfigField.ReferalTrigger, important: true, type: ConfigType.number, value: '600' },
        { key: ConfigField.ReferalReward, important: true, type: ConfigType.number, value: '20' },
        { key: ConfigField.ReferalRewardPlayer, important: true, type: ConfigType.number, value: '20' },
        { key: ConfigField.ReferalPaymentPercent, important: true, type: ConfigType.number, value: '0' },
        { key: ConfigField.MonitoringReward, important: true, type: ConfigType.number, value: '2' },
        { key: ConfigField.LinkMctop, important: true, type: ConfigType.string, value: 'https://unicorecms.ru' },
        { key: ConfigField.LinkMinecraftraiting, important: true, type: ConfigType.string, value: 'https://unicorecms.ru' },
        { key: ConfigField.LinkTopcraft, important: true, type: ConfigType.string, value: 'https://unicorecms.ru' },
        { key: ConfigField.UnbanPrice, important: true, type: ConfigType.number, value: '150' },
        { key: ConfigField.VirtualPercent, important: true, type: ConfigType.number, value: '75' },
        { key: ConfigField.VotesTwinkProtect, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.StoreKitsVirtualUse, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.StoreProductsVirtualUse, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.DonateGroupsVirtualUse, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.DonatePermsVirtualUse, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.GiftsCodeEnabled, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.GiftsDirectEnabled, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.GiftsDailyLimit, important: true, type: ConfigType.number, value: String(GIFTS_DAILY_LIMIT) },
        { key: ConfigField.GiftsCodeExpireDays, important: true, type: ConfigType.number, value: String(GIFTS_CODE_EXPIRE_DAYS) },
        { key: ConfigField.EmailActivationRequired, important: true, type: ConfigType.boolean, value: 'true' },
        { key: ConfigField.OrdinaryRegister, important: true, type: ConfigType.boolean, value: 'false' },
        { key: ConfigField.RoleBadgeBefore, important: true, type: ConfigType.boolean, value: 'false' },
        { key: ConfigField.KeepPaidPaymentsDays, important: true, type: ConfigType.number, value: String(KEEP_PAID_PAYMENTS_DAYS) },
        {
          key: ConfigField.KeepPendingPaymentsDays,
          important: true,
          type: ConfigType.number,
          value: String(KEEP_PENDING_PAYMENTS_DAYS),
        },
        { key: ConfigField.KeepHistoryDays, important: true, type: ConfigType.number, value: String(KEEP_HISTORY_DAYS) },
        { key: ConfigField.RconPreset, important: true, type: ConfigType.string, value: DEFAULT_ISSUANCE_PRESET },
        {
          key: ConfigField.RconTplGiveItem,
          important: true,
          type: ConfigType.string,
          value: presetOps.giveItem ?? vanillaOps.giveItem ?? '',
        },
        { key: ConfigField.RconTplGroupAdd, important: true, type: ConfigType.string, value: presetOps.groupAdd ?? '' },
        { key: ConfigField.RconTplGroupAddTemp, important: true, type: ConfigType.string, value: presetOps.groupAddTemp ?? '' },
        { key: ConfigField.RconTplGroupRemove, important: true, type: ConfigType.string, value: presetOps.groupRemove ?? '' },
        { key: ConfigField.RconTplPermSet, important: true, type: ConfigType.string, value: presetOps.permSet ?? '' },
        { key: ConfigField.RconTplPermSetTemp, important: true, type: ConfigType.string, value: presetOps.permSetTemp ?? '' },
        { key: ConfigField.RconTplPermUnset, important: true, type: ConfigType.string, value: presetOps.permUnset ?? '' },
      ])
      .orIgnore()
      .execute();

    await this.initModules();
  }

  private async initModules(): Promise<void> {
    const values = moduleConfigSchema().flatMap((module) =>
      module.fields.map((field) => ({
        key: moduleConfigKey(module.id, field),
        value: field.default === undefined || field.default === null ? null : String(field.default),
        important: true,
        type: configTypeOf(field.type),
      })),
    );

    if (!values.length) return;

    await this.configRepo.createQueryBuilder().insert().into(Config).values(values).orIgnore().execute();
  }

  async find() {
    return this.configTransformer(await this.configRepo.find({ order: { important: 'DESC' } }));
  }

  async load(): Promise<LoadedConfig> {
    const cached = await this.cacheManager.get<LoadedConfig>(CacheKey.Config);

    if (cached) return cached;

    const config = _.chain(await this.find()).keyBy('key').mapValues('value').value() as LoadedConfig;

    await this.cacheManager.set(CacheKey.Config, config, CONFIG_CACHE_TTL_MS);

    return config;
  }

  private async invalidate() {
    await this.cacheManager.del(CacheKey.Config);
  }

  async findPublic() {
    const values = _.chain((await this.find()).filter((c) => c.key.startsWith('public_')))
      .keyBy('key')
      .mapValues('value')
      .value();

    return { ...values, [ACTIVE_MODULES_KEY]: enabledModuleIds().join(',') };
  }

  private assertValue(input: ConfigInput) {
    if (input.type == ConfigType.number && !isValidConfigNumber(input.key, input.value)) throw new BadRequestException();
  }

  async create(input: ConfigInput) {
    if (await this.configRepo.findOneBy({ key: input.key })) throw new BadRequestException();

    this.assertValue(input);

    const cfg = new Config();

    cfg.value = input.value;
    cfg.key = input.key;
    cfg.type = input.type;

    const saved = await this.configRepo.save(cfg);
    await this.invalidate();

    return saved;
  }

  async update(input: ConfigInput) {
    const cfg = await this.configRepo.findOneBy({ key: input.key });

    if (!cfg) throw new NotFoundException();

    this.assertValue(input);

    cfg.value = input.value;
    cfg.type = input.type;

    const saved = await this.configRepo.save(cfg);
    await this.invalidate();

    return saved;
  }

  async delate(key: string) {
    const cfg = await this.configRepo.findOneBy({ key, important: IsNull() });

    if (!cfg) throw new NotFoundException();

    const removed = await this.configRepo.remove(cfg);
    await this.invalidate();

    return removed;
  }
}
