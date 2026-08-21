import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const readLocaleFiles = (dir: string): Record<string, Record<string, string>> => {
  if (!existsSync(dir)) return {};

  const locales: Record<string, Record<string, string>> = {};

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;

    try {
      const parsed = JSON.parse(readFileSync(join(dir, file), 'utf-8'));

      if (parsed && typeof parsed === 'object') locales[file.replace(/\.json$/, '')] = parsed;
    } catch {
      continue;
    }
  }

  return locales;
};
