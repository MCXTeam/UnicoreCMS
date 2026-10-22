import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const server = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(server, 'package.json'));
const ts = require('typescript');
const { build } = require('esbuild');
require('reflect-metadata');
const transpile = (source, fileName = 'fixture.ts') => ts.transpileModule(source, { fileName, compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

export async function compileConnect(directory) {
  const outfile = join(directory, 'connect.cjs');
  await build({
    entryPoints: [join(server, 'test/fixtures/connect-services.ts')], outfile, bundle: true, platform: 'node', format: 'cjs', tsconfig: join(server, 'tsconfig.json'),
    plugins: [{ name: 'connect-contracts', setup(builder) {
      builder.onResolve({ filter: /\.entity$/ }, (args) => args.path.includes('connect/') || args.importer.replaceAll('\\', '/').includes('game/connect/') && args.path.startsWith('./entities/') ? undefined : { path: 'fixtures', namespace: 'entities' });
      builder.onLoad({ filter: /.*/, namespace: 'entities' }, () => ({ contents: transpile(`
        import { Entity, PrimaryColumn, Column } from 'typeorm';
        @Entity('unicore_users') export class User { @PrimaryColumn({type:'varchar',length:36}) uuid: string; @Column({type:'varchar',default:''}) username: string; @Column({type:'boolean',default:false}) superuser: boolean; }
        @Entity('unicore_servers') export class Server { @PrimaryColumn({type:'varchar',length:64}) id: string; }
        @Entity('unicore_playtimes') export class Playtime { @PrimaryColumn({type:'varchar',length:64}) serverId: string; @PrimaryColumn({type:'varchar',length:36}) userUuid: string; @Column({type:'int',default:0}) time: number; }
        export class Online {} export class ServerInstance {} export class OnlinesRecord {} export class OnlinesAbsoluteRecord {}
      `), loader: 'js' }));
      builder.onResolve({ filter: /^@common$/ }, () => ({ path: 'common', namespace: 'fixture' }));
      builder.onResolve({ filter: /^src\/admin\/roles\/grant$/ }, () => ({ path: 'roles', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({ contents: args.path === 'common' ? 'export const CacheKey = {Playtime: "playtime"}; export const DEFAULT_MINECRAFT_PORT=25565; export const PING_TIMEOUT_MS=100;' : 'export async function userPermissionCheck(target, actor) { return actor.superuser || !target.superuser; }', loader: 'js' }));
      builder.onLoad({ filter: /\.ts$/ }, async (args) => ({ contents: transpile(await readFile(args.path, 'utf8'), args.path), loader: 'js' }));
      builder.onResolve({ filter: /^[^./]/ }, (args) => {
        if (args.kind === 'entry-point' || /^[a-z]:/i.test(args.path) || args.path.startsWith('src/')) return;
        return { path: require.resolve(args.path), external: true };
      });
    } }],
  });
  return { module: require(outfile), require };
}
