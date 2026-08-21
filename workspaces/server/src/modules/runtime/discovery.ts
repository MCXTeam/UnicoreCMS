import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { modulesPath } from 'unicore-common';
import { ModuleManifest, validateModuleManifest } from 'unicore-api';

export interface DiscoveredModule {
  id: string;
  dir: string;
  manifest: ModuleManifest;
  enabled: boolean;
  serverEntry: string | null;
}

export interface DiscoveryResult {
  modules: DiscoveredModule[];
  broken: { id: string; reason: string }[];
}

export type ModulesState = Record<string, { enabled?: boolean; installedVersion?: string }>;

const STATE_FILE = () => join(modulesPath, 'state.json');

export const readState = (): ModulesState => {
  const path = STATE_FILE();

  if (!existsSync(path)) return {};

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));

    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const writeState = (state: ModulesState): void => {
  if (!existsSync(modulesPath)) return;

  writeFileSync(STATE_FILE(), `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
};

export const discover = (): DiscoveryResult => {
  const modules: DiscoveredModule[] = [];
  const broken: { id: string; reason: string }[] = [];

  if (!existsSync(modulesPath)) return { modules, broken };

  const state = readState();

  for (const name of readdirSync(modulesPath).sort()) {
    if (name.startsWith('.') || name === 'node_modules') continue;

    const dir = join(modulesPath, name);
    if (!statSync(dir).isDirectory()) continue;

    const manifestPath = join(dir, 'module.json');
    if (!existsSync(manifestPath)) continue;

    let raw: unknown;

    try {
      raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch (error) {
      broken.push({ id: name, reason: `module.json не читается: ${String(error)}` });
      continue;
    }

    const { manifest, errors } = validateModuleManifest(raw);

    if (!manifest) {
      broken.push({ id: name, reason: errors.join('; ') });
      continue;
    }

    if (manifest.id !== name) {
      broken.push({ id: name, reason: `id «${manifest.id}» не совпадает с именем папки «${name}»` });
      continue;
    }

    modules.push({
      id: manifest.id,
      dir,
      manifest,
      enabled: state[manifest.id]?.enabled !== false,
      serverEntry: manifest.server ? resolve(dir, manifest.server) : null,
    });
  }

  return { modules, broken };
};
