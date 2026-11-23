import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const require = createRequire(join(root, 'package.json'));
const { build } = require('esbuild');

export async function settingsFixture(directory) {
  const outfile = join(directory, 'settings.cjs');
  await build({
    stdin: {
      contents: `export { ModulesController } from './src/modules/modules.controller'; export { ConfigService } from './src/admin/config/config.service'; export { ConfigController } from './src/admin/config/config.controller'; export { Config } from './src/admin/config/entities/config.entity'; export { coreConfigDefaults } from './src/admin/config/settings.schema'; export { coreSettingsSchema } from './src/admin/config/settings.schema'; export { ConfigField } from './src/admin/config/config.enum';`,
      resolveDir: root,
      loader: 'ts',
    },
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    tsconfig: join(root, 'tsconfig.json'),
    plugins: [
      {
        name: 'settings-dependencies',
        setup(builder) {
          builder.onResolve({ filter: /^(?:\.\/modules\.service|\.\/rebuild\.service)$/ }, (args) => ({
            path: args.path,
            namespace: 'module-stub',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'module-stub' }, () => ({
            contents: 'export class ModulesService {}; export class RebuildService {}; export const REBUILD_SIDES = [];',
            loader: 'ts',
          }));
          builder.onResolve({ filter: /config\.entity$/ }, () => ({ path: 'config-entity', namespace: 'fixture' }));
          builder.onResolve({ filter: /(?:src\/modules\/runtime$|permisson\.guard$|src\/auth\/laminara\/builds$)/ }, (args) => ({
            path: args.path,
            namespace: 'fixture',
          }));
          builder.onResolve({ filter: /^@common$/ }, () => ({ path: 'common', namespace: 'fixture' }));
          builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => {
            if (args.path === 'config-entity') return { contents: 'export class Config {}', loader: 'ts' };
            if (args.path === 'common')
              return {
                contents: `export * from ${JSON.stringify(join(root, 'src/common/constants.ts'))}; export * from ${JSON.stringify(
                  join(root, 'src/common/cache-key.enum.ts'),
                )}; export * from ${JSON.stringify(join(root, 'src/common/utils/config-value.ts'))}; export * from ${JSON.stringify(
                  join(root, 'src/common/audit/audit.decorator.ts'),
                )};`,
                loader: 'ts',
                resolveDir: root,
              };
            if (args.path.endsWith('permisson.guard'))
              return {
                contents:
                  'export const matchPermission = async (permissions, request) => permissions.some(key => request.permissions.includes(key));',
                loader: 'ts',
              };
            if (args.path.endsWith('/builds')) return { contents: 'export const syncLauncherBuilds = () => {};', loader: 'ts' };
            return {
              contents: `const fields = [{key:'limit',type:'number',default:3,min:1,max:10,integer:true},{key:'mode',type:'select',default:'all',options:[{value:'all',label:'All'},{value:'staff',label:'Staff'}]}]; export const discover=()=>({modules:[{id:'sample',enabled:true,manifest:{name:'Sample',config:fields}},{id:'disabled',enabled:false,manifest:{name:'Disabled',config:[{key:'label',type:'string',default:'hidden',public:true}]}}]}); export const moduleConfigSchema=()=>[{id:'sample',fields}]; export const enabledModuleIds=()=>['sample'];`,
              loader: 'ts',
            };
          });
          builder.onResolve({ filter: /^[^./]|^@/ }, (args) => {
            if (args.kind === 'entry-point' || /^[a-z]:/i.test(args.path) || args.path.startsWith('src/')) return;
            return { path: require.resolve(args.path), external: true };
          });
        },
      },
    ],
  });
  return require(outfile);
}
