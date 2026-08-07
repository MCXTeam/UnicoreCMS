export const LOCALE_CODE_PATTERN = /^[a-z]{2}(-[a-z]{2})?$/;

export const DEFAULT_LOCALES = [
  { code: "ru", name: "Русский", enabled: true, is_default: true, priority: 0 },
  {
    code: "en",
    name: "English",
    enabled: true,
    is_default: false,
    priority: 1,
  },
];

export type LocaleCode = "ru" | "en";

export const LOCALE_HEADER = "x-locale";
export const LOCALE_COOKIE = "locale";
export const LOCALE_ADMIN_COOKIE = "locale_admin";
export const RAW_CONTENT_HEADER = "x-raw-content";

export const PRIMEVUE_LOCALE_KEYS = [
  "accept",
  "reject",
  "choose",
  "upload",
  "cancel",
  "clear",
  "apply",
  "today",
  "weekHeader",
  "emptyMessage",
  "emptyFilterMessage",
  "emptySearchMessage",
  "emptySelectionMessage",
  "chooseYear",
  "chooseMonth",
  "chooseDate",
  "prevDecade",
  "nextDecade",
  "prevYear",
  "nextYear",
  "prevMonth",
  "nextMonth",
  "searchMessage",
  "selectionMessage",
] as const;

export const PRIMEVUE_ARIA_KEYS = [
  "pageLabel",
  "firstPageLabel",
  "lastPageLabel",
  "nextPageLabel",
  "prevPageLabel",
] as const;
