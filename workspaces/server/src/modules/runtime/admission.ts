import { existsSync } from 'fs';
import { satisfies } from 'semver';
import { API_VERSION } from 'unicore-api';
import { assertExtension } from 'unicore-api/licensing';
import { DiscoveredModule } from './discovery';

export const admitModules = (modules: DiscoveredModule[]) => {
  const candidates = new Map(modules.filter((item) => item.enabled).map((item) => [item.id, item]));
  const rejected = new Map<string, string>();
  const ordered: DiscoveredModule[] = [];
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (module: DiscoveredModule): boolean => {
    if (done.has(module.id)) return !rejected.has(module.id);
    if (visiting.has(module.id)) {
      rejected.set(module.id, 'Циклическая зависимость модулей');
      return false;
    }
    visiting.add(module.id);
    try {
      if (!satisfies(API_VERSION, module.manifest.unicoreApi))
        throw new Error(`требует API ${module.manifest.unicoreApi}, установлен ${API_VERSION}`);
      if (module.serverEntry && !existsSync(module.serverEntry)) throw new Error('Серверная часть не найдена');
      assertExtension({ kind: 'module', id: module.id, directory: module.dir, manifest: module.manifest });
      for (const [id, range] of Object.entries(module.manifest.requires?.modules || {})) {
        const dependency = candidates.get(id);
        if (!dependency || !satisfies(dependency.manifest.version, String(range)) || !visit(dependency))
          throw new Error(`Недоступна зависимость «${id}» ${range}`);
      }
      if (rejected.has(module.id)) return false;
      ordered.push(module);
    } catch (error) {
      const reason =
        error instanceof Error && 'code' in error
          ? `licensing.reason.${String(error.code)}`
          : error instanceof Error
          ? error.message
          : 'extension_license_required';
      rejected.set(module.id, reason);
    } finally {
      visiting.delete(module.id);
      done.add(module.id);
    }
    return !rejected.has(module.id);
  };
  for (const module of candidates.values()) visit(module);
  return { ordered, failures: [...rejected].map(([id, reason]) => ({ id, reason })) };
};
