export const DEFAULT_TIMEZONE = "UTC";

export const DEFAULT_CLIENT_PORT = 3000;
export const DEFAULT_ADMIN_PORT = 4000;
export const DEFAULT_BACKEND_PORT = 5000;

export const CLIENT_PORT_KEYS = ["CLIENT_PORT"];
export const ADMIN_PORT_KEYS = ["ADMIN_PORT"];
export const BACKEND_PORT_KEYS = ["BACKEND_PORT", "SERVER_PORT"];

export const MIN_PORT = 1;
export const MAX_PORT = 65535;

export const RUNTIME_ENV_PREFIX = "NUXT_PUBLIC_";

export const PUBLIC_ENV_KEY = {
  baseurl: "BASEURL",
  apiBaseurl: "API_BASEURL",
  adminBaseurl: "ADMIN_BASEURL",
  sitename: "SITENAME",
  timezone: "TIMEZONE",
  recaptchaPublic: "RECAPTCHA_PUBLIC",
  googleAnalyticsId: "GOOGLE_ANALYTICS_ID",
  yandexMetrikaId: "YANDEX_METRIKA_ID",
  jwtExpires: "JWT_EXPIRES",
  jwtRefreshExpires: "JWT_REFRESH_EXPIRES",
  realDecimals: "REAL_DECIMALS",
  virtualDecimals: "VIRTUAL_DECIMALS",
  ingameDecimals: "INGAME_DECIMALS",
  colorModePreference: "COLOR_MODE_PREFERENCE",
  colorModeFallback: "COLOR_MODE_FALLBACK",
  devseed: "DEV_SEED",
} as const;

export const PUBLIC_ENV_KEYS: string[] = [
  ...CLIENT_PORT_KEYS,
  ...ADMIN_PORT_KEYS,
  ...BACKEND_PORT_KEYS,
  ...Object.values(PUBLIC_ENV_KEY),
];

export const IS_USERNAME = "isUsername";
export const IS_USERNAME_OR_EMAIL = "isUsernameOrEmail";
export const IS_DONATE_WEB_PERM = "isDonateWebPerm";

export const DONATE_WEB_PERM_PREFIXES = ["user."];

export const DEFAULT_ISSUANCE_PRESET = "luckperms";

export const PASSWORD_ALGORITHMS = ["argon2id", "bcrypt"] as const;
export const DEFAULT_PASSWORD_ALGORITHM = "argon2id";
export const DEFAULT_ARGON2_MEMORY = 65536;
export const DEFAULT_ARGON2_TIME = 3;
export const DEFAULT_ARGON2_PARALLELISM = 4;
export const DEFAULT_BCRYPT_COST = 12;

export const CGROUP_LIMIT_FILES = ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"];
export const CGROUP_LIMIT_MAX = 64 * 1024 * 1024 * 1024;
export const BUILD_HEAP_SHARE = 0.75;
export const BUILD_HEAP_MIN_MB = 512;
export const BUILD_KILL_SIGNALS: string[] = ["SIGKILL", "SIGABRT"];

export const LOG_DIR_NAME = "logs";
export const LOG_ERROR_FILE_NAME = "error.log";
export const LOG_DIR_MODE = 0o750;
export const LOG_FILE_MODE = 0o640;
export const LOG_REDACT_DEPTH = 6;
export const LOG_REDACTED = "[redacted]";
export const LOG_REDACT_KEYS = [
  "parameters",
  "password",
  "passwordhash",
  "secret",
  "two_factor_secret",
  "two_factor_secret_temp",
  "token",
  "accesstoken",
  "refreshtoken",
  "access_token",
  "refresh_token",
  "authorization",
  "apikey",
  "api_key",
  "jwtkey",
  "cookie",
];

export const SANITIZE_ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "span",
  "div",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "ins",
  "sub",
  "sup",
  "small",
  "mark",
  "blockquote",
  "pre",
  "code",
  "ol",
  "ul",
  "li",
  "a",
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "details",
  "summary",
  "section",
  "article",
  "figure",
  "figcaption",
  "caption",
  "colgroup",
  "col",
  "dl",
  "dt",
  "dd",
];

export const SANITIZE_ALLOWED_ATTR = [
  "id",
  "open",
  "colspan",
  "rowspan",
  "href",
  "target",
  "rel",
  "title",
  "name",
  "src",
  "alt",
  "width",
  "height",
  "class",
  "style",
];

export const SANITIZE_FORBID_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
];

export const SANITIZE_FORBID_ATTR = [
  "onerror",
  "onload",
  "onclick",
  "onmouseover",
  "onmouseenter",
  "onfocus",
];

export const SANITIZE_ALLOWED_SCHEMES = ["http", "https", "mailto", "tel"];
