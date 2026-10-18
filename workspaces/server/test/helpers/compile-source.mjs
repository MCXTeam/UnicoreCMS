import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const server = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(server, 'package.json'));
const { build } = require('esbuild');

export async function compileSource(source, directory, name = 'module') {
  const outfile = join(directory, `${name}.cjs`);
  await build({
    entryPoints: [join(server, 'src', source)], outfile, bundle: true, platform: 'node', format: 'cjs',
    tsconfig: join(server, 'tsconfig.json'),
    plugins: [{
      name: 'test-runtime',
      setup(builder) {
        builder.onResolve({ filter: /\.entity$/ }, (args) => ({ path: args.path, namespace: 'entities' }));
        builder.onLoad({ filter: /.*/, namespace: 'entities' }, () => ({ contents: 'export class Payment {} export class PaymentSetting {} export class User {} export class Bonus {}', loader: 'js' }));
        builder.onResolve({ filter: /^[^./]|^@/ }, (args) => {
          if (args.kind === 'entry-point' || /^[a-z]:/i.test(args.path)) return;
          if (args.path === '@common' || args.path.startsWith('src/')) return;
          return { path: require.resolve(args.path), external: true };
        });
      },
    }],
  });
  return require(outfile);
}
