import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { satisfies } from 'semver';
import { modulesPath, themesPath } from 'unicore-common';
import {
  API_VERSION,
  LocalizedText,
  MODULE_ID_PATTERN,
  ModuleManifest,
  ThemeManifest,
  validateModuleManifest,
  validateThemeManifest,
} from 'unicore-api';
import { StorageManager } from 'src/common/storage/storage.class';
import { formatError } from '@common';
import { DataSource } from 'typeorm';
import { ExtensionKind, extractArchive, readExtensionArchive } from './archive';
import { InstallResultDto } from '../dto/install-result.dto';
import { ModulesService } from '../modules.service';
import { activeThemeId, readThemesState, ThemeSide, writeThemesState } from '../runtime/themes';
import { discover } from '../runtime/discovery';

@Injectable()
export class InstallService {
  private readonly logger = new Logger('Modules');

  constructor(private readonly modules: ModulesService, private readonly dataSource: DataSource) {}

  async install(filename: string): Promise<InstallResultDto> {
    const buffer = StorageManager.read(filename);

    StorageManager.remove(filename);

    if (!buffer) throw new BadRequestException('Архив не прочитан');

    const content = await readExtensionArchive(buffer);
    const manifest = this.validate(content.kind, content.raw);
    const root = content.kind === 'module' ? modulesPath : themesPath;

    if (!existsSync(root)) mkdirSync(root, { recursive: true });

    const target = join(root, manifest.id);
    const temp = join(root, `.install-${manifest.id}-${process.pid}`);
    const previous = this.installedVersion(target, content.kind);

    rmSync(temp, { recursive: true, force: true });

    try {
      await extractArchive(content, temp);
      this.assertParts(content.kind, manifest, temp);
      this.swap(temp, target, root, manifest.id);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }

    this.logger.log(
      `${content.kind === 'module' ? 'Модуль' : 'Тема'} ${manifest.id} ${manifest.version} ${previous ? 'обновлён' : 'установлен'}`,
    );

    return new InstallResultDto({
      kind: content.kind,
      id: manifest.id,
      name: manifest.name as LocalizedText,
      version: manifest.version,
      previousVersion: previous,
      steps: this.steps(content.kind, manifest, target),
    });
  }

  private validate(kind: ExtensionKind, raw: unknown): ModuleManifest | ThemeManifest {
    const { manifest, errors } = kind === 'module' ? validateModuleManifest(raw) : validateThemeManifest(raw);

    if (!manifest) throw new BadRequestException(`Манифест не прошёл проверку: ${errors.join('; ')}`);

    if (!satisfies(API_VERSION, manifest.unicoreApi))
      throw new BadRequestException(`Расширение требует API ${manifest.unicoreApi}, установлен ${API_VERSION}`);

    return manifest;
  }

  private installedVersion(target: string, kind: ExtensionKind): string | undefined {
    const manifestPath = join(target, kind === 'module' ? 'module.json' : 'theme.json');

    if (!existsSync(manifestPath)) return undefined;

    try {
      return JSON.parse(readFileSync(manifestPath, 'utf-8')).version;
    } catch {
      return undefined;
    }
  }

  private assertParts(kind: ExtensionKind, manifest: ModuleManifest | ThemeManifest, dir: string): void {
    const inside = (relative: string): string => {
      const path = resolve(dir, relative);

      if (path !== dir && !path.startsWith(`${dir}/`)) throw new BadRequestException(`Путь «${relative}» выходит за папку расширения`);

      return path;
    };

    const required: { relative: string; directory: boolean }[] = [];

    if (kind === 'module') {
      const module = manifest as ModuleManifest;

      if (module.server) required.push({ relative: module.server, directory: false });
      if (module.client) required.push({ relative: module.client, directory: true });
      if (module.admin) required.push({ relative: module.admin, directory: true });
      if (module.locales) required.push({ relative: module.locales, directory: true });
    } else {
      const theme = manifest as ThemeManifest;

      if (theme.tokens) required.push({ relative: theme.tokens, directory: false });
      if (theme.primevue) required.push({ relative: theme.primevue, directory: false });

      for (const file of Object.values(theme.pages?.replace || {})) required.push({ relative: file, directory: false });
    }

    for (const { relative, directory } of required) {
      const path = inside(relative);

      if (!existsSync(path)) throw new BadRequestException(`Манифест ссылается на «${relative}», но такого пути в архиве нет`);

      if (statSync(path).isDirectory() !== directory)
        throw new BadRequestException(`Путь «${relative}» должен быть ${directory ? 'папкой' : 'файлом'}`);
    }
  }

  private swap(temp: string, target: string, root: string, id: string): void {
    const backup = join(root, `.backup-${id}-${process.pid}`);
    let backedUp = false;

    rmSync(backup, { recursive: true, force: true });

    if (existsSync(target)) {
      renameSync(target, backup);
      backedUp = true;
    }

    try {
      renameSync(temp, target);
    } catch (error) {
      if (backedUp) renameSync(backup, target);

      throw new BadRequestException(`Папка расширения не заменена: ${formatError(error)}`);
    }

    if (!backedUp) return;

    const dependencies = join(backup, 'node_modules');

    if (existsSync(dependencies) && !existsSync(join(target, 'node_modules'))) renameSync(dependencies, join(target, 'node_modules'));

    rmSync(backup, { recursive: true, force: true });
  }

  private steps(kind: ExtensionKind, manifest: ModuleManifest | ThemeManifest, target: string) {
    const module = kind === 'module' ? (manifest as ModuleManifest) : null;

    return {
      dependencies: this.hasDependencies(target),
      rebuild: kind === 'theme' || Boolean(module?.client || module?.admin),
      restart: kind === 'module',
    };
  }

  async remove(kind: ExtensionKind, id: string): Promise<{ removed: boolean }> {
    if (!MODULE_ID_PATTERN.test(id)) throw new BadRequestException('Некорректный идентификатор расширения');

    const root = kind === 'module' ? modulesPath : themesPath;
    const target = join(root, id);

    if (!existsSync(target)) throw new NotFoundException();

    if (kind === 'module') {
      const module = discover().modules.find((item) => item.id === id);

      if (module?.enabled) throw new BadRequestException('Сначала выключите модуль');

      await this.modules.purge(id);
    } else {
      await this.removeThemeData(id);
    }

    rmSync(target, { recursive: true, force: true });

    this.logger.log(`${kind === 'module' ? 'Модуль' : 'Тема'} ${id} удалён вместе с папкой`);

    return { removed: true };
  }

  private async removeThemeData(id: string): Promise<void> {
    for (const side of ['client', 'admin'] as ThemeSide[])
      if (activeThemeId(side) === id) throw new BadRequestException('Тема активна, сначала выберите другую');

    await this.dataSource.query('DELETE FROM unicore_translations WHERE translation_key LIKE ?', [`theme.${id}.%`]);

    const state = readThemesState();

    writeThemesState({
      client: state.client === id ? null : state.client,
      admin: state.admin === id ? null : state.admin,
    });
  }

  private hasDependencies(target: string): boolean {
    const path = join(target, 'package.json');

    if (!existsSync(path)) return false;

    try {
      const parsed = JSON.parse(readFileSync(path, 'utf-8'));

      return Boolean(Object.keys(parsed.dependencies || {}).length);
    } catch {
      return false;
    }
  }
}
