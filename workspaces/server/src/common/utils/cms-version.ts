import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { projectRoot } from 'unicore-common';

const SERVER_PACKAGE = resolve(projectRoot, 'workspaces', 'server', 'package.json');

let cached: string | undefined;

export function cmsVersion(): string | undefined {
  if (cached !== undefined) return cached || undefined;

  cached = process.env.npm_package_version || '';

  if (!cached && existsSync(SERVER_PACKAGE)) {
    try {
      cached = String(JSON.parse(readFileSync(SERVER_PACKAGE, 'utf-8')).version || '');
    } catch {
      cached = '';
    }
  }

  return cached || undefined;
}
