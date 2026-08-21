import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { themesPath } from 'unicore-common';
import { ThemeManifest, validateThemeManifest } from 'unicore-api';
import { readLocaleFiles } from './locales';

export interface DiscoveredTheme {
  id: string;
  dir: string;
  manifest: ThemeManifest;
}

export interface ThemeDiscoveryResult {
  themes: DiscoveredTheme[];
  broken: { id: string; reason: string }[];
}

export interface ThemesState {
  active?: string | null;
}

const STATE_FILE = () => join(themesPath, 'state.json');

export const readThemesState = (): ThemesState => {
  const path = STATE_FILE();

  if (!existsSync(path)) return {};

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));

    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const writeThemesState = (state: ThemesState): void => {
  if (!existsSync(themesPath)) return;

  writeFileSync(STATE_FILE(), `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
};

export const activeThemeId = (): string | null => process.env.UNICORE_THEME || readThemesState().active || null;

export const themeLockedByEnv = (): boolean => Boolean(process.env.UNICORE_THEME);

export const themeLocales = (id: string): Record<string, Record<string, string>> => readLocaleFiles(join(themesPath, id, 'locales'));

export const activeThemeLocales = (): Record<string, Record<string, string>> => {
  const id = activeThemeId();

  return id ? themeLocales(id) : {};
};

export const discoverThemes = (): ThemeDiscoveryResult => {
  const themes: DiscoveredTheme[] = [];
  const broken: { id: string; reason: string }[] = [];

  if (!existsSync(themesPath)) return { themes, broken };

  for (const name of readdirSync(themesPath).sort()) {
    if (name.startsWith('.') || name === 'node_modules') continue;

    const dir = join(themesPath, name);
    if (!statSync(dir).isDirectory()) continue;

    const manifestPath = join(dir, 'theme.json');
    if (!existsSync(manifestPath)) continue;

    let raw: unknown;

    try {
      raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch (error) {
      broken.push({ id: name, reason: `theme.json не читается: ${String(error)}` });
      continue;
    }

    const { manifest, errors } = validateThemeManifest(raw);

    if (!manifest) {
      broken.push({ id: name, reason: errors.join('; ') });
      continue;
    }

    if (manifest.id !== name) {
      broken.push({ id: name, reason: `id «${manifest.id}» не совпадает с именем папки «${name}»` });
      continue;
    }

    themes.push({ id: manifest.id, dir, manifest });
  }

  return { themes, broken };
};
