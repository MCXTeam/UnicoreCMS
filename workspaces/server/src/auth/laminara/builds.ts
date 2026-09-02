import {
  LAUNCHER_BUILD_PERMISSION_PREFIX,
  LAUNCHER_PERMISSION_GROUP,
  launcherBuildPermission,
  parseLauncherBuilds,
  permissionEntries,
  registerPermissions,
  unregisterPermissions,
} from 'unicore-common';

export function syncLauncherBuilds(value: unknown): void {
  const wanted = parseLauncherBuilds(value).map(launcherBuildPermission);
  const current = permissionEntries()
    .map((entry) => entry.key)
    .filter((key) => key.startsWith(LAUNCHER_BUILD_PERMISSION_PREFIX));
  const stale = current.filter((key) => !wanted.includes(key));
  const missing = wanted.filter((key) => !current.includes(key));

  if (stale.length) unregisterPermissions(stale);
  if (missing.length) registerPermissions(Object.fromEntries(missing.map((key) => [key, { group: LAUNCHER_PERMISSION_GROUP }])));
}
