import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { modulePrefixes } from 'unicore-api';
import { ModuleDto, ModuleStatus } from './dto/module.dto';
import { ModuleRecord } from './entities/module.entity';
import { discover, readState, writeState } from './runtime/discovery';
import { moduleConfigKey } from 'src/admin/config/module-config';
import { moduleRuntime } from './runtime';

@Injectable()
export class ModulesService implements OnModuleInit {
  private readonly logger = new Logger('Modules');

  constructor(
    @InjectRepository(ModuleRecord) private readonly records: Repository<ModuleRecord>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    const runtime = moduleRuntime();

    if (!runtime.loaded.length) return;

    try {
      for (const module of runtime.loaded)
        await this.records
          .createQueryBuilder()
          .insert()
          .into(ModuleRecord)
          .values({ id: module.id, version: module.manifest.version, enabled: true })
          .orUpdate(['version', 'enabled', 'broken_reason'], ['id'])
          .execute();
    } catch (error) {
      this.logger.warn(`Реестр модулей недоступен, выполните schema:sync: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async find(): Promise<ModuleDto[]> {
    const { modules } = discover();
    const runtime = moduleRuntime();
    const known = new Set((await this.records.find()).map((record) => record.id));

    return modules.map((module) => {
      const failure = runtime.failures.find((item) => item.id === module.id);
      const loaded = runtime.loaded.find((item) => item.id === module.id);

      let status: ModuleStatus = 'new';

      if (failure) status = 'broken';
      else if (!module.enabled) status = 'disabled';
      else if (loaded) status = 'active';
      else if (known.has(module.id)) status = 'disabled';

      return new ModuleDto({
        id: module.id,
        name: module.manifest.name,
        description: module.manifest.description,
        version: module.manifest.version,
        unicoreApi: module.manifest.unicoreApi,
        author: module.manifest.author,
        homepage: module.manifest.homepage,
        status,
        reason: failure?.reason,
        hasServer: Boolean(module.manifest.server),
        hasClient: Boolean(module.manifest.client),
        hasAdmin: Boolean(module.manifest.admin),
        permissions: module.manifest.permissions || [],
        config: module.manifest.config || [],
      });
    });
  }

  async setEnabled(id: string, enabled: boolean): Promise<{ restartRequired: boolean; rebuildRequired: boolean }> {
    const { modules } = discover();
    const module = modules.find((item) => item.id === id);

    if (!module) throw new NotFoundException();

    const state = readState();

    state[id] = { ...(state[id] || {}), enabled, installedVersion: module.manifest.version };
    writeState(state);

    await this.records
      .createQueryBuilder()
      .insert()
      .into(ModuleRecord)
      .values({ id, version: module.manifest.version, enabled })
      .orUpdate(['version', 'enabled'], ['id'])
      .execute();

    return { restartRequired: true, rebuildRequired: Boolean(module.manifest.client || module.manifest.admin) };
  }

  async purge(id: string): Promise<void> {
    const { modules } = discover();
    const module = modules.find((item) => item.id === id);

    if (module?.enabled) throw new BadRequestException('Сначала выключите модуль');

    const prefixes = modulePrefixes(id);
    const runner = this.dataSource.createQueryRunner();

    await runner.connect();

    try {
      const tables: { name: string }[] = await runner.query(
        'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE ?',
        [`${prefixes.table}%`],
      );

      await runner.query('SET FOREIGN_KEY_CHECKS = 0');

      for (const table of tables) await runner.query(`DROP TABLE IF EXISTS \`${table.name}\``);

      await runner.query('SET FOREIGN_KEY_CHECKS = 1');

      await runner.query('DELETE FROM unicore_configs WHERE `key` LIKE ? OR `key` LIKE ?', [
        `${prefixes.config}%`,
        `${prefixes.publicConfig}%`,
      ]);

      await runner.query('DELETE FROM unicore_translations WHERE translation_key LIKE ?', [`${prefixes.locale}%`]);
    } finally {
      await runner.release();
    }

    await this.records.delete({ id });

    const state = readState();

    delete state[id];
    writeState(state);
  }

  async settings(id: string): Promise<{ key: string; value: string | null; field: unknown }[]> {
    const { modules } = discover();
    const module = modules.find((item) => item.id === id);

    if (!module) throw new NotFoundException();

    const fields = module.manifest.config || [];

    if (!fields.length) return [];

    const keys = fields.map((field) => moduleConfigKey(id, field));
    const rows: { key: string; value: string | null }[] = await this.dataSource.query(
      `SELECT \`key\`, value FROM unicore_configs WHERE \`key\` IN (${keys.map(() => '?').join(',')})`,
      keys,
    );

    return fields.map((field) => {
      const key = moduleConfigKey(id, field);

      return { key, value: rows.find((row) => row.key === key)?.value ?? null, field };
    });
  }
}
