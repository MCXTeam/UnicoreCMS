import { discover, DiscoveredModule } from './discovery';
import { checkRequirements, load, LoadedModule, LoadFailure } from './loader';

export interface ModuleRuntimeState {
  loaded: LoadedModule[];
  failures: LoadFailure[];
  disabled: DiscoveredModule[];
}

let state: ModuleRuntimeState | null = null;

const initialize = (): ModuleRuntimeState => {
  const { modules, broken } = discover();
  const { loaded, failures } = load(modules);
  const requirementFailures = checkRequirements(loaded);
  const rejected = new Set(requirementFailures.map((item) => item.id));

  return {
    loaded: loaded.filter((item) => !rejected.has(item.id)),
    failures: [...broken.map((item) => ({ id: item.id, reason: item.reason })), ...failures, ...requirementFailures],
    disabled: modules.filter((item) => !item.enabled),
  };
};

export const moduleRuntime = (): ModuleRuntimeState => {
  if (!state) state = initialize();

  return state;
};

export const moduleEntities = (): unknown[] => moduleRuntime().loaded.flatMap((item) => item.contribution?.entities || []);

export const moduleNestImports = (): any[] => moduleRuntime().loaded.flatMap((item) => item.contribution?.nestModules || []);

export const modulePaymentModules = (): any[] => moduleRuntime().loaded.flatMap((item) => item.contribution?.paymentModules || []);

export const moduleWebhookChannels = (): any[] => moduleRuntime().loaded.flatMap((item) => item.contribution?.webhookChannels || []);

export const modulePermissions = (): string[] => moduleRuntime().loaded.flatMap((item) => item.contribution?.permissions || []);

export const moduleConfigSchema = (): { id: string; fields: NonNullable<LoadedModule['contribution']>['config'] }[] =>
  moduleRuntime()
    .loaded.filter((item) => item.contribution?.config.length)
    .map((item) => ({ id: item.id, fields: item.contribution!.config }));

export const moduleLocales = (): { id: string; locales: Record<string, Record<string, string>> }[] =>
  moduleRuntime()
    .loaded.filter((item) => Object.keys(item.contribution?.locales || {}).length)
    .map((item) => ({ id: item.id, locales: item.contribution!.locales }));

export * from './discovery';
export * from './loader';
