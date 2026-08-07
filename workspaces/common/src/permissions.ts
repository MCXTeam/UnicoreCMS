import { PERMISSION_WILDCARD_SUFFIX } from "./constants";

export function expandPermissionPattern(pattern: string): string[] {
  if (!pattern.endsWith(PERMISSION_WILDCARD_SUFFIX)) return [pattern];

  const exact = pattern.slice(0, -PERMISSION_WILDCARD_SUFFIX.length);

  return exact ? [pattern, exact] : [pattern];
}
