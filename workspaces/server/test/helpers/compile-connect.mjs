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
      builder.onResolve({ filter: /\.entity$/ }, (args) => /game\/(connect|punishments)\/|cabinet\/bans\//.test((args.path.startsWith('src/') ? join(server, args.path) : resolve(dirname(args.importer), args.path)).replaceAll('\\', '/')) ? undefined : { path: 'fixtures', namespace: 'entities' });
      builder.onLoad({ filter: /.*/, namespace: 'entities' }, () => ({ contents: transpile(`
        import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToOne, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
        @Entity('unicore_roles') export class Role { @PrimaryColumn({type:'varchar',length:64}) id:string; @Column({type:'int',default:0}) priority:number; @Column({type:'simple-json',nullable:true}) appearance:any; }
        @Entity('unicore_skins') export class Skin { @PrimaryColumn({type:'varchar',length:36}) userUuid:string; }
        @Entity('unicore_cloaks') export class Cloak { @PrimaryColumn({type:'varchar',length:36}) userUuid:string; }
        @Entity('unicore_users') export class User {
          @PrimaryColumn({type:'varchar',length:36}) uuid: string;
          @Column({type:'varchar',default:''}) username: string;
          @Column({type:'boolean',default:false}) superuser: boolean;
          @Column({type:'double',default:0}) real:number;
          @Column({type:'double',default:0}) virtual:number;
          @Column({type:'varchar',default:'private'}) password:string;
          @CreateDateColumn() created:Date;
          @ManyToMany(()=>Role) @JoinTable() roles:Role[];
          @OneToOne(()=>Skin,{createForeignKeyConstraints:false}) @JoinColumn({name:'uuid'}) skin:Skin;
          @OneToOne(()=>Cloak,{createForeignKeyConstraints:false}) @JoinColumn({name:'uuid'}) cloak:Cloak;
        }
        @Entity('unicore_servers') export class Server { @PrimaryColumn({type:'varchar',length:64}) id: string; @Column({type:'varchar',default:''}) name:string; }
        @Entity('unicore_playtimes') export class Playtime { @PrimaryColumn({type:'varchar',length:64}) serverId: string; @PrimaryColumn({type:'varchar',length:36}) userUuid: string; @Column({type:'int',default:0}) time: number; }
        @Entity('unicore_history') export class History { @PrimaryGeneratedColumn('uuid') id:string; @Column({type:'varchar'}) type:string; @ManyToOne(()=>User) user:User; @Column({type:'varchar',nullable:true}) ip:string; @Column({type:'double',default:0}) real_spent:number; @Column({type:'double',default:0}) virtual_spent:number; }
        @Entity('unicore_server_instances') export class ServerInstance { @PrimaryColumn({type:'varchar',length:36}) id:string; }
        export class Online {} export class OnlinesRecord {} export class OnlinesAbsoluteRecord {}
      `), loader: 'js' }));
      builder.onResolve({ filter: /^@common$/ }, () => ({ path: 'common', namespace: 'fixture' }));
      builder.onResolve({ filter: /^fixture-config-number$/ }, () => ({ path: join(server, 'src/common/utils/config-value.ts'), namespace: 'file' }));
      builder.onResolve({ filter: /^src\/admin\/roles\/grant$/ }, () => ({ path: 'roles', namespace: 'fixture' }));
      builder.onResolve({ filter: /^src\/admin\/config\/config.service$/ }, () => ({ path: 'config', namespace: 'fixture' }));
      builder.onResolve({ filter: /^src\/admin\/roles\/guards\/permisson.guard$/ }, () => ({ path: 'permissions', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({ contents: ({
        common: 'export * from "unicore-common"; export { configNumber } from "fixture-config-number"; export const CacheKey = {Playtime: "playtime"}; export const DEFAULT_MINECRAFT_PORT=25565; export const PING_TIMEOUT_MS=100; export const SafeCron=()=>()=>{};',
        roles: 'export async function userPermissionCheck(target, actor) { return actor.superuser || !target.superuser; }',
        config: 'export class ConfigService {}',
        permissions: 'import { satisfiesPermissions } from "unicore-common"; export async function matchPermission(args, request) { const [perms, opts] = Array.isArray(args[0]) ? args : [args, {}]; return request.user.superuser || satisfiesPermissions(request.user.perms || [], perms, Boolean(opts?.or)); }',
      })[args.path], loader: 'js' }));
      builder.onLoad({ filter: /\.ts$/ }, async (args) => ({ contents: transpile(await readFile(args.path, 'utf8'), args.path), loader: 'js' }));
      builder.onResolve({ filter: /^[^./]/ }, (args) => {
        if (args.kind === 'entry-point' || /^[a-z]:/i.test(args.path) || args.path.startsWith('src/')) return;
        return { path: require.resolve(args.path), external: true };
      });
    } }],
  });
  return { module: require(outfile), require };
}
