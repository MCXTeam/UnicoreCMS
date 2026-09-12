export const LAYOUT_PLACES = ["header", "footer"] as const;

export type LayoutPlace = (typeof LAYOUT_PLACES)[number];

export const LAYOUT_MODES = ["builder", "html"] as const;

export type LayoutMode = (typeof LAYOUT_MODES)[number];

export const LAYOUT_BLOCK_TYPES = [
  "logo",
  "nav",
  "text",
  "image",
  "icons",
  "html",
  "login",
  "launcher",
  "locale",
  "theme",
  "online",
  "notifications",
  "spacer",
] as const;

export type LayoutBlockType = (typeof LAYOUT_BLOCK_TYPES)[number];

export const LAYOUT_VISIBILITY = ["always", "auth", "guest"] as const;

export type LayoutVisibility = (typeof LAYOUT_VISIBILITY)[number];

export const LAYOUT_SCREENS = ["mobile", "desktop"] as const;

export type LayoutScreen = (typeof LAYOUT_SCREENS)[number];

export const LAYOUT_ALIGNMENTS = ["start", "center", "end", "between"] as const;

export type LayoutAlignment = (typeof LAYOUT_ALIGNMENTS)[number];

export type LayoutText = Record<string, string>;

export interface LayoutLink {
  id: string;
  label?: LayoutText;
  labelKey?: string;
  to?: string;
  href?: string;
  configLink?: string;
  icon?: string;
  when?: LayoutVisibility;
}

export interface LayoutBlock {
  id: string;
  type: LayoutBlockType;
  when?: LayoutVisibility;
  hideOn?: LayoutScreen[];
  grow?: boolean;
  title?: LayoutText;
  text?: LayoutText;
  html?: string;
  image?: string;
  href?: string;
  size?: number;
  columns?: number;
  links?: LayoutLink[];
}

export interface LayoutRow {
  id: string;
  align?: LayoutAlignment;
  blocks: LayoutBlock[];
}

export interface LayoutDefinition {
  mode: LayoutMode;
  rows: LayoutRow[];
  html: string;
}

export type LayoutState = Record<LayoutPlace, LayoutDefinition>;

export const LAYOUT_PLACEHOLDERS = [
  "logo",
  "sitename",
  "nav",
  "login",
  "launcher",
  "locale",
  "theme",
  "online",
  "notifications",
  "year",
] as const;

export type LayoutPlaceholder = (typeof LAYOUT_PLACEHOLDERS)[number];

export const LAYOUT_PLACEHOLDER_PATTERN = /\{\{\s*([a-z]+)\s*\}\}/g;

export const layoutText = (
  text: LayoutText | undefined,
  locale: string,
  fallback = "",
): string => {
  if (!text) return fallback;

  const exact = text[locale];

  if (exact) return exact;

  const first = Object.values(text).find((value) => value && value.trim());

  return first || fallback;
};

export const isLayoutPlace = (value: unknown): value is LayoutPlace =>
  typeof value === "string" && LAYOUT_PLACES.includes(value as LayoutPlace);
