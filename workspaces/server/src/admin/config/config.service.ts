import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { envConfig } from 'unicore-common';
import { ACTIVE_MODULES_KEY, settingIssue, ConfigFieldSchema, SettingsCatalog, SettingsCategory, SettingsField, SettingsChange } from 'unicore-api';
import { CacheKey } from '@common';
import { IsNull, Repository } from 'typeorm';
import { ConfigField, ConfigType } from './config.enum';
import { enabledModuleIds } from 'src/modules/runtime';
import { configTypeOf, inactiveModuleConfigPrefixes, moduleConfigKey, moduleSettingsSchemas } from './module-config';
import { CONFIG_CACHE_TTL_MS } from './config.constants';
import { isValidConfigNumber } from './config.utils';
import { ConfigInput } from './dto/config.input';
import { syncLauncherBuilds } from 'src/auth/laminara/builds';
import { Config } from './entities/config.entity';
import _ from 'lodash';
import { CORE_SETTINGS_CATEGORIES, coreSettingsSchema, coreConfigDefaults } from './settings.schema';

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
    await this.configRepo.createQueryBuilder().insert().into(Config).values(coreConfigDefaults()).orIgnore().execute();

    await this.initModules();
    await this.load();
  }

  private async initModules(): Promise<void> {
    const values = moduleSettingsSchemas().flatMap((module) =>
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
    const rows = await this.configRepo.find({ order: { important: 'DESC' } });
    const hidden = inactiveModuleConfigPrefixes();

    return this.configTransformer(rows.filter((row) => !hidden.some((prefix) => row.key.startsWith(prefix))));
  }

  async load(): Promise<LoadedConfig> {
    const cached = await this.cacheManager.get<LoadedConfig>(CacheKey.Config);

    if (cached) return cached;

    const config = _.chain(await this.find()).keyBy('key').mapValues('value').value() as LoadedConfig;

    await this.cacheManager.set(CacheKey.Config, config, CONFIG_CACHE_TTL_MS);
    syncLauncherBuilds(config[ConfigField.LaminaraBuilds]);

    return config;
  }

  private async invalidate() {
    await this.cacheManager.del(CacheKey.Config);
    await this.load();
  }

  async findPublic() {
    const values = _.chain((await this.find()).filter((c) => c.key.startsWith('public_')))
      .keyBy('key')
      .mapValues('value')
      .value();

    return { ...values, [ACTIVE_MODULES_KEY]: enabledModuleIds().join(',') };
  }

  async projectName(): Promise<string> {
    const config = await this.load();

    return String(config[ConfigField.ProjectName] || envConfig.sitename);
  }

  private definitions(): (ConfigFieldSchema & { moduleId?: string })[] {
    return [...coreSettingsSchema(), ...moduleSettingsSchemas().flatMap((module) => module.fields.map((field) => ({
      ...field, key: moduleConfigKey(module.id, field), moduleId: module.id,
      category: `module:${module.id}${field.category ? `:${field.category}` : ''}`,
    })))];
  }

  async settings(moduleId?: string): Promise<SettingsCatalog> {
    const rows = await this.configRepo.find();
    const hidden = inactiveModuleConfigPrefixes();
    const definitions = this.definitions();
    const modules = moduleSettingsSchemas();
    if (moduleId && !modules.some((module) => module.id === moduleId)) throw new NotFoundException();
    const fields: SettingsField[] = definitions.filter((field) => moduleId ? field.moduleId === moduleId : !hidden.some((prefix) => field.key.startsWith(prefix)))
      .map((field) => ({ ...field, category: field.category || 'other', value: rows.find((row) => row.key === field.key)?.value ?? null }));
    const categories: SettingsCategory[] = [...CORE_SETTINGS_CATEGORIES];
    for (const field of fields.filter((item) => item.moduleId)) {
      if (categories.some((category) => category.id === field.category)) continue;
      const module = modules.find((item) => item.id === field.moduleId);
      const group = field.category.slice(`module:${field.moduleId}`.length + 1);
      const names = typeof module.name === 'string' ? { en: module.name, ru: module.name } : module.name;
      const label = group ? Object.fromEntries(Object.entries(names).map(([locale, name]) => [locale, `${name} · ${group}`])) : module.name;
      categories.push({ id: field.category, label, icon: 'pi pi-box' });
    }
    return { fields, categories: categories.filter((category) => fields.some((field) => field.category === category.id)) };
  }

  async saveSettings(changes: SettingsChange[], moduleId?: string): Promise<SettingsCatalog> {
    if (!Array.isArray(changes) || !changes.length || changes.length > 200 || new Set(changes.map((item) => item.key)).size !== changes.length)
      throw new BadRequestException('settings.error.request');
    const definitions = this.definitions();
    const errors: Record<string, string> = {};
    for (const change of changes) {
      const field = definitions.find((entry) => entry.key === change.key && (!moduleId || entry.moduleId === moduleId));
      const error = field ? settingIssue(field, change.value) : 'settings.error.unknown';
      if (error) errors[change.key] = error;
      if (change.expected !== null && typeof change.expected !== 'string') errors[change.key] = 'settings.error.request';
    }
    if (Object.keys(errors).length) throw new BadRequestException({ message: 'settings.error.validation', fields: errors });

    await this.configRepo.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Config);
      for (const change of [...changes].sort((a, b) => a.key.localeCompare(b.key))) {
        const field = definitions.find((entry) => entry.key === change.key);
        if (change.expected === null) {
          await repository.createQueryBuilder().insert().into(Config).values({
            key: change.key, value: null, type: configTypeOf(field.type), important: true,
          }).orIgnore().execute();
        }
        const row = await repository.findOne({ where: { key: change.key }, lock: { mode: 'pessimistic_write' } });
        if (!row || row.value !== change.expected) throw new ConflictException({ message: 'settings.error.conflict', fields: { [change.key]: 'settings.error.conflict' } });
        row.value = change.value;
        row.type = configTypeOf(field.type);
        await repository.save(row);
      }
    });
    await this.invalidate();
    return this.settings(moduleId);
  }

  private assertValue(input: ConfigInput) {
    if (input.value !== null && input.value !== undefined && !['string', 'number', 'boolean'].includes(typeof input.value)) throw new BadRequestException();
    if (input.value !== null && input.value !== undefined) input.value = String(input.value);
    const field = this.definitions().find((entry) => entry.key === input.key);
    if (field && (configTypeOf(field.type) !== input.type || settingIssue(field, input.value))) throw new BadRequestException();
    if (!field && input.type === ConfigType.boolean && !['true', 'false', '0', '1'].includes(input.value)) throw new BadRequestException();
    if (input.type == ConfigType.number && !isValidConfigNumber(input.key, input.value)) throw new BadRequestException();
  }

  async create(input: ConfigInput) {
    if (this.definitions().some((field) => field.key === input.key)) throw new BadRequestException();
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

  async remove(key: string) {
    const cfg = await this.configRepo.findOneBy({ key, important: IsNull() });

    if (!cfg) throw new NotFoundException();

    const removed = await this.configRepo.remove(cfg);
    await this.invalidate();

    return removed;
  }
}
