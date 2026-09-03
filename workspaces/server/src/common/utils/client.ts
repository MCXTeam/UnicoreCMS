import { AUDIT_CLIENT_MAX_LENGTH, AUDIT_LAUNCHER_CLIENT_PREFIX } from '../constants';

const BROWSERS: [RegExp, string][] = [
  [/edg[ea]?\//i, 'Edge'],
  [/opr\/|opera/i, 'Opera'],
  [/yabrowser/i, 'Yandex'],
  [/firefox\//i, 'Firefox'],
  [/chrome\/|crios/i, 'Chrome'],
  [/safari\//i, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/windows nt/i, 'Windows'],
  [/android/i, 'Android'],
  [/iphone|ipad|ipod/i, 'iOS'],
  [/mac os x|macintosh/i, 'macOS'],
  [/linux/i, 'Linux'],
];

export function launcherClient(launcher: string): string {
  return `${AUDIT_LAUNCHER_CLIENT_PREFIX}${launcher}`.slice(0, AUDIT_CLIENT_MAX_LENGTH);
}

export function clientName(agent?: string): string | null {
  const value = String(agent ?? '').trim();

  if (!value) return null;

  const browser = BROWSERS.find(([pattern]) => pattern.test(value))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(value))?.[1];

  if (!browser && !system) return value.slice(0, AUDIT_CLIENT_MAX_LENGTH);

  return [browser, system].filter(Boolean).join(' / ');
}
