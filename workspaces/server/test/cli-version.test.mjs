import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');

test('CLI help keeps its version when the entry is emitted into a nested chunk directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'unicore-cli-version-'));
  try {
    const output = join(root, 'dist/cli/chunks/main.cjs');
    await mkdir(join(root, 'dist/cli/chunks'), { recursive: true });
    await build({
      entryPoints: [fileURLToPath(new URL('../src/cli/main.ts', import.meta.url))],
      outfile: output,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      plugins: [
        {
          name: 'cli-context',
          setup(builder) {
            builder.onResolve(
              { filter: /^@common$|^@nestjs\/core$|^typeorm-transactional$|^\.\/command\.module$|^\.\/commands$/ },
              (args) => ({ path: args.path, namespace: 'cli-context' }),
            );
            builder.onLoad({ filter: /.*/, namespace: 'cli-context' }, (args) => ({
              contents:
                args.path === '@common'
                  ? 'export const ASCII_NAME="UnicoreCMS";export const stdout=value=>process.stdout.write(value+"\\n");'
                  : args.path === '@nestjs/core'
                  ? 'export const NestFactory={createApplicationContext:async()=>({get:()=>undefined,close:async()=>{}})};'
                  : args.path === 'typeorm-transactional'
                  ? 'export const initializeTransactionalContext=()=>{};'
                  : args.path === './commands'
                  ? 'export const CLI_COMMANDS=[];'
                  : 'export class CommandsModule {}',
              loader: 'js',
            }));
            builder.onResolve({ filter: /^[^./]/ }, (args) =>
              args.kind === 'entry-point' || /^[a-z]:/i.test(args.path) ? undefined : { path: require.resolve(args.path), external: true },
            );
          },
        },
      ],
    });
    const result = spawnSync(process.execPath, [output, '--help'], { cwd: root, encoding: 'utf8', timeout: 15000 });
    const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(result.stdout.includes(`Version: ${version}`));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
