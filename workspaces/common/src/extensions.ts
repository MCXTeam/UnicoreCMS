export const EXTENSION_KINDS = ["module", "theme"] as const;

export type ExtensionKind = (typeof EXTENSION_KINDS)[number];

export const EXTENSION_SOURCE_TYPES = ["github", "url"] as const;

export type ExtensionSourceType = (typeof EXTENSION_SOURCE_TYPES)[number];

export const EXTENSION_SOURCE_NAME_MAX_LENGTH = 64;

export const EXTENSION_SOURCE_LOCATION_MAX_LENGTH = 255;

export const GITHUB_REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export const EXTENSION_ASSET_PATTERN =
  /^([a-z][a-z0-9_]{2,31})-(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\.zip$/i;

export const EXTENSION_ARCHIVE_PATTERN = /\.zip(?:[?#].*)?$/i;

export const EXTENSION_STATUSES = [
  "new",
  "installed",
  "update",
  "ahead",
] as const;

export type ExtensionCatalogStatus = (typeof EXTENSION_STATUSES)[number];

export const BUILTIN_EXTENSION_SOURCES: readonly {
  name: string;
  kind: ExtensionKind;
  location: string;
}[] = [
  {
    name: "UnicoreCMS",
    kind: "module",
    location: "MCXTeam/UnicoreCMS-modules",
  },
  { name: "UnicoreCMS", kind: "theme", location: "MCXTeam/UnicoreCMS-themes" },
];

export function isGithubRepo(location: string): boolean {
  return GITHUB_REPO_PATTERN.test(location);
}
