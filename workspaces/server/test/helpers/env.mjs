import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const root = resolve(here, '..', '..', '..', '..');

function envFile() {
  try {
    return readFileSync(resolve(root, '.env'), 'utf8');
  } catch {
    return '';
  }
}

const parsed = Object.fromEntries(
  envFile()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');

      return [
        line.slice(0, index).trim(),
        line
          .slice(index + 1)
          .trim()
          .replace(/^["']|["']$/g, ''),
      ];
    }),
);

const read = (key, fallback) => process.env[key] ?? parsed[key] ?? fallback;

export const api = read('API_BASEURL', `http://127.0.0.1:${read('SERVER_PORT', read('BACKEND_PORT', 5000))}`);

export const database = {
  host: read('DATABASE_HOST', '127.0.0.1'),
  port: Number(read('DATABASE_PORT', 3306)),
  user: read('DATABASE_USER', 'root'),
  password: read('DATABASE_PASSWORD', ''),
  database: read('DATABASE_NAME', 'unicore'),
};
