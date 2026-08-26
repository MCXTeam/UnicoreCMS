import { existsSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { satisfies } from 'semver';
import { getMetadataArgsStorage } from 'typeorm';
import { PATH_METADATA } from '@nestjs/common/constants';
import { modulesPath, PERMISSION_LOCALE_PREFIX, permissionGroupKey } from 'unicore-common';
import { API_VERSION, contribution, ModuleContribution, modulePermissionKey, modulePrefixes } from 'unicore-api';
import { DiscoveredModule } from './discovery';

const requireFromModules = createRequire(join(modulesPath, 'loader.js'));

export interface LoadedModule extends DiscoveredModule {
  contribution: ModuleContribution | null;
}

export interface LoadFailure {
  id: string;
  reason: string;
}

const controllerPath = (controller: unknown): string => String(Reflect.getMetadata(PATH_METADATA, controller as object) || '');

const validateNamespaces = (module: DiscoveredModule, contributed: ModuleContribution): string[] => {
  const prefixes = modulePrefixes(module.id);
  const problems: string[] = [];

  const tables = getMetadataArgsStorage().tables;

  for (const entity of contributed.entities) {
    const table = tables.find((item) => item.target === entity);
    const name = table?.name || '';

    if (!name) problems.push(`сущность ${String((entity as { name?: string })?.name)} должна задавать имя таблицы`);
    else if (!name.startsWith(prefixes.table)) problems.push(`таблица «${name}» должна начинаться с «${prefixes.table}»`);
  }

  for (const permission of contributed.permissions.map(modulePermissionKey))
    if (!permission.startsWith(prefixes.permission)) problems.push(`право «${permission}» должно начинаться с «${prefixes.permission}»`);

  const permissionLocale = `${PERMISSION_LOCALE_PREFIX}${prefixes.permission}`;
  const permissionGroupLocale = permissionGroupKey(`mod.${module.id}`);

  for (const [locale, messages] of Object.entries(contributed.locales))
    for (const key of Object.keys(messages))
      if (!key.startsWith(prefixes.locale) && !key.startsWith(permissionLocale) && key !== permissionGroupLocale)
        problems.push(`ключ локали «${key}» (${locale}) должен начинаться с «${prefixes.locale}»`);

  for (const field of contributed.config)
    if (!/^[a-z][a-z0-9_]*$/.test(field.key)) problems.push(`ключ настройки «${field.key}» должен быть в нижнем регистре`);

  for (const nestModule of contributed.nestModules) {
    const controllers: unknown[] = Reflect.getMetadata('controllers', nestModule as object) || [];

    for (const controller of controllers) {
      const path = controllerPath(controller).replace(/^\/+/, '');
      const base = prefixes.route.replace(/\/$/, '');

      if (path !== base && !path.startsWith(prefixes.route))
        problems.push(`маршрут «/${path}» должен начинаться с «/${base}»`);
    }
  }

  return problems;
};

export const load = (modules: DiscoveredModule[]): { loaded: LoadedModule[]; failures: LoadFailure[] } => {
  const loaded: LoadedModule[] = [];
  const failures: LoadFailure[] = [];

  for (const module of modules) {
    if (!module.enabled) continue;

    if (!satisfies(API_VERSION, module.manifest.unicoreApi)) {
      failures.push({
        id: module.id,
        reason: `требует API ${module.manifest.unicoreApi}, установлен ${API_VERSION}`,
      });
      continue;
    }

    if (!module.serverEntry) {
      loaded.push({ ...module, contribution: null });
      continue;
    }

    if (!existsSync(module.serverEntry)) {
      failures.push({ id: module.id, reason: `серверная часть не найдена: ${module.manifest.server}` });
      continue;
    }

    try {
      requireFromModules(module.serverEntry);
    } catch (error) {
      failures.push({ id: module.id, reason: `ошибка загрузки: ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }

    const contributed = contribution(module.id);

    if (!contributed) {
      failures.push({ id: module.id, reason: 'серверная часть не вызвала defineModule с таким же id' });
      continue;
    }

    const problems = validateNamespaces(module, contributed);

    if (problems.length) {
      failures.push({ id: module.id, reason: problems.join('; ') });
      continue;
    }

    loaded.push({ ...module, contribution: contributed });
  }

  return { loaded, failures };
};

export const checkRequirements = (loaded: LoadedModule[]): LoadFailure[] => {
  const versions = new Map(loaded.map((item) => [item.id, item.manifest.version]));
  const failures: LoadFailure[] = [];

  for (const module of loaded) {
    const requires = module.manifest.requires?.modules || {};

    for (const [id, range] of Object.entries(requires)) {
      const version = versions.get(id);

      if (!version) failures.push({ id: module.id, reason: `требует модуль «${id}», который не загружен` });
      else if (!satisfies(version, String(range))) failures.push({ id: module.id, reason: `требует «${id}» ${range}, установлен ${version}` });
    }
  }

  return failures;
};
