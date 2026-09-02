export const ASCII_NAME =
  " __  __                                          ____              ____       \r\n/\\ \\/\\ \\          __                            /\\  _`\\    /'\\_/`\\/\\  _`\\     \r\n\\ \\ \\ \\ \\    ___ /\\_\\    ___    ___   _ __    __\\ \\ \\/\\_\\ /\\      \\ \\,\\L\\_\\   \r\n \\ \\ \\ \\ \\ /' _ `\\/\\ \\  /'___\\ / __`\\/\\`'__\\/'__`\\ \\ \\/_/_\\ \\ \\__\\ \\/_\\__ \\   \r\n  \\ \\ \\_\\ \\/\\ \\/\\ \\ \\ \\/\\ \\__//\\ \\L\\ \\ \\ \\//\\  __/\\ \\ \\L\\ \\\\ \\ \\_/\\ \\/\\ \\L\\ \\ \r\n   \\ \\_____\\ \\_\\ \\_\\ \\_\\ \\____\\ \\____/\\ \\_\\\\ \\____\\\\ \\____/ \\ \\_\\\\ \\_\\ `\\____\\\r\n    \\/_____/\\/_/\\/_/\\/_/\\/____/\\/___/  \\/_/ \\/____/ \\/___/   \\/_/ \\/_/\\/_____/";

export const TOTP_WINDOW = 1;
export const TOTP_CODE_MAX_LENGTH = 10;
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
export const TOTP_SECRET_BYTES = 20;
export const REQUIRE_2FA = 'require2fa';

export const REFRESH_ROTATION_LEEWAY_MS = 30_000;

export const WS_API_KEY_PREFIX = 'Api-Key ';
export const WS_BEARER_PREFIX = 'Bearer ';
export const WS_PUBLIC_ROOM = 'public';

export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSIONS_KEY = 'permissions';
export const RUNTIME_PERMISSIONS_KEY = 'runtimePermissions';
export const DONATE_PERMS_CACHE_KEY = '__donateWebPerms';
export const ALLOW_INACTIVE_KEY = 'allowInactive';
export const ALLOW_PASSWORD_PENDING_KEY = 'allowPasswordPending';
export const PASSWORD_CHANGE_REQUIRED = 'password_change_required';

export const STATIC_CONTENT_SECURITY_POLICY = "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'; sandbox";

export const HSTS_MAX_AGE_SECONDS = 15552000;
export const SWAGGER_PATH = 'docs';

export const STORAGE_MAX_IMAGE_UPLOAD = 2 * 1024 * 1024;
export const STORAGE_MAX_ZIP_UPLOAD = 50 * 1024 * 1024;

export const IMAGE_EXTENSION_PATTERN = /\.(jpg|jpeg|png|gif|webp)$/i;
export const ZIP_EXTENSION_PATTERN = /\.zip$/i;
export const PNG_EXTENSION_PATTERN = /\.png$/i;
export const STORAGE_MAX_REMOTE_DOWNLOAD = 10 * 1024 * 1024;

export const IMPORT_MAX_ENTRIES = 1000;

export const EXTENSION_MAX_FILES = 3000;
export const EXTENSION_MAX_UNPACKED_BYTES = 128 * 1024 * 1024;
export const EXTENSION_MAX_PATH_LENGTH = 200;
export const EXTENSION_CATALOG_CACHE_TTL_MS = 10 * 60_000;
export const EXTENSION_DOWNLOAD_TIMEOUT_MS = 60_000;
export const EXTENSION_DOWNLOAD_MAX_REDIRECTS = 5;
export const EXTENSION_CATALOG_MAX_BYTES = 2 * 1024 * 1024;
export const GITHUB_API_BASEURL = 'https://api.github.com';
export const GITHUB_API_VERSION = '2022-11-28';
export const GITHUB_RELEASES_PER_PAGE = 100;
export const GITHUB_TOKEN_HOSTS = ['api.github.com', 'github.com', 'codeload.github.com'];
export const IMPORT_MAX_UNPACKED_BYTES = 100 * 1024 * 1024;

export const RCON_COMMAND_MAX_LENGTH = 1000;
export const RCON_MAX_ATTEMPTS = 8;
export const RCON_BACKOFF_BASE_MS = 30_000;
export const RCON_BACKOFF_MAX_MS = 30 * 60_000;
export const RCON_BATCH_LIMIT = 200;
export const RCON_STALE_MS = 5 * 60_000;
export const RCON_TEST_TIMEOUT_MS = 5000;

export const EMAIL_CODE_LENGTH = 6;
export const EMAIL_CODE_ALPHABET = '1234567890';
export const EMAIL_ACTIVATION_TTL_MINUTES = 60;
export const EMAIL_ACTIVATION_MAX_ATTEMPTS = 5;
export const EMAIL_ACTIVATION_RESEND_WINDOW_MINUTES = 5;
export const EMAIL_ACTIVATION_RESEND_MAX = 3;

export const PASSWORD_RESET_HASH_LENGTH = 32;
export const PASSWORD_RESET_TTL_MINUTES = 60;
export const PASSWORD_RESET_WINDOW_MINUTES = 5;
export const PASSWORD_RESET_MAX = 3;

export const THROTTLE_LOGIN = { ttl: 5 * 60_000, limit: 15 };
export const THROTTLE_REGISTER = { ttl: 60 * 60_000, limit: 5 };
export const THROTTLE_VERIFY = { ttl: 10 * 60_000, limit: 10 };
export const THROTTLE_RESEND = { ttl: 10 * 60_000, limit: 3 };
export const THROTTLE_PASSWORD_RESET = { ttl: 60 * 60_000, limit: 5 };
export const THROTTLE_REFRESH = { ttl: 5 * 60_000, limit: 60 };
export const THROTTLE_LAUNCHER_LOGIN = { ttl: 5 * 60_000, limit: 30 };
export const THROTTLE_UNSKIPPABLE_PREFIX = '/auth/';
export const AUTH_LOGIN_PATH = '/auth/login';

export const COOKIE_PAIR_SEPARATOR = ';';
export const COOKIE_VALUE_SEPARATOR = '=';
export { REFRESH_COOKIE, CSRF_COOKIE, CSRF_HEADER } from 'unicore-common/auth';
export const CSRF_TOKEN_BYTES = 32;
export const COOKIE_SAMESITE_SAME_ORIGIN = 'lax';
export const COOKIE_SAMESITE_CROSS_SITE = 'none';
export const COOKIE_PATH = '/';
export const THROTTLE_LOGIN_TRACKER_PREFIX = 'login:';
export const THROTTLE_LOGIN_FIELD = 'login';

export const QUERY_SEPARATOR = '?';

export const CRYPTO_PREFIX = 'enc';
export const CRYPTO_VERSION = 1;
export const CRYPTO_CIPHER = 'aes-256-gcm';
export const CRYPTO_KEY_BYTES = 32;
export const CRYPTO_IV_BYTES = 12;
export const CRYPTO_TAG_BYTES = 16;
export const CRYPTO_HKDF_HASH = 'sha256';
export const CRYPTO_HKDF_SALT = 'unicore-cms';

export const HTML_ESCAPE_PATTERN = /[&<>"']/g;
export const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const CRYPTO_FINGERPRINT_HASH = 'sha256';
export const CRYPTO_FINGERPRINT_LENGTH = 16;

export const CRYPTO_PURPOSE_PASSWORD = 'password-wrap';
export const CRYPTO_PURPOSE_FIELD = 'field';

export const ENCRYPTED_RCON_PASSWORD = 'rcon.password';
export const ENCRYPTED_TWO_FACTOR_SECRET = 'user.two_factor_secret';
export const ENCRYPTED_TWO_FACTOR_SECRET_TEMP = 'user.two_factor_secret_temp';
export const ENCRYPTED_SOURCE_TOKEN = 'extension_source.token';

export const PASSWORD_ALGORITHM_ARGON2ID = 'argon2id';
export const PASSWORD_ALGORITHM_BCRYPT = 'bcrypt';
export const PASSWORD_ARGON2_PREFIXES = ['$argon2id$', '$argon2i$', '$argon2d$'];
export const PASSWORD_BCRYPT_PREFIXES = ['$2a$', '$2b$', '$2y$'];

export { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from 'unicore-common';

export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60_000;
export const LOGIN_ATTEMPT_CAPTCHA_AFTER = 3;
export const LOGIN_ATTEMPT_BLOCK_AFTER = 10;
export const LOGIN_ATTEMPT_BLOCK_AFTER_CAPTCHA = 25;
export const LOGIN_ATTEMPT_COOLDOWN_BASE_MS = 5_000;
export const LOGIN_ATTEMPT_COOLDOWN_MAX_MS = 5 * 60_000;
export const LOGIN_ATTEMPT_ANONYMOUS_SOURCE = 'unknown';
export const LOGIN_ATTEMPT_FIELD = 'username_or_email';
export const RETRY_AFTER_HEADER = 'Retry-After';
export const TOO_MANY_ATTEMPTS_MESSAGE = 'Too Many Requests';

export const PWNED_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
export const PWNED_HASH = 'sha1';
export const PWNED_PREFIX_LENGTH = 5;
export const PWNED_TIMEOUT_MS = 3000;
export const PWNED_CACHE_TTL_MS = 24 * 60 * 60_000;
export const PWNED_PADDING_HEADER = 'Add-Padding';
export const PWNED_LINE_SEPARATOR = /\r?\n/;
export const PWNED_FIELD_SEPARATOR = ':';

export const TOKEN_MAX_LENGTH = 4096;
export const SERVER_ID_MAX_LENGTH = 128;
export const IP_MAX_LENGTH = 45;

export const NAME_MAX_LENGTH = 120;
export const CUSTOM_CODE_MAX_LENGTH = 100_000;
export const TEXT_MAX_LENGTH = 2000;
export const PATH_MAX_LENGTH = 120;
export const PATH_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const IS_IP_PATTERN = 'isIpPattern';
export const IP_ANY_PATTERN = '*';
export const IPV4_MAPPED_PREFIX = '::ffff:';

export const RANDOM_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
export const RANDOM_ID_LENGTH = 21;

export const API_KEY_LENGTH = 64;
export const API_KEY_COMMENT_MAX_LENGTH = 120;
export const API_KEY_HASH = 'sha256';

export const SKIN_MAX_SIZE = 2048;

export const BULK_ITEMS_MAX = 500;
export const CART_AMOUNT_MIN = 1;
export const CART_AMOUNT_MAX = 10000;

export const SERVER_GALLERY_MAX_IMAGES = 30;
export const SERVER_TABLE_MAX_ROWS = 50;
export const SERVER_INSTANCES_MAX = 50;
export const SERVER_MODS_MAX = 5000;

export const DEFAULT_SKIN_FILE = 'default/skin.png';
export const DEFAULT_CLOAK_FILE = 'default/cloak.png';
export const TEXTURE_CACHE_CONTROL = 'no-cache';

export const KERNEL_USERNAME = 'Kernel';

export const PUBLIC_USERS_PAGE_SIZE = 1000;

export const REBUILD_LOG_LINES = 300;

export const REBUILD_BUILD_SCRIPT = 'build.mjs';

export const USER_SEARCH_LIMIT = 10;

export const USER_SEARCH_MAX_LIMIT = 50;
export const PUBLIC_USERS_CACHE_TTL_MS = 60_000;
export const THROTTLE_PUBLIC_USERS = { ttl: 60_000, limit: 30 };

export const PORT_MIN = 0;
export const PORT_MAX = 65535;
export const DEFAULT_MINECRAFT_PORT = 25565;
export const PING_TIMEOUT_MS = 3000;

export const NEWS_PREVIEW_LENGTH = 300;
export const LAUNCHER_NEWS_LIMIT = 20;
export const LAUNCHER_NEWS_MAX_LIMIT = 100;

export const DASHBOARD_WEEK_DAYS = 7;
export const DASHBOARD_MONTH_DAYS = 30;

export const PAYMENT_AMOUNT_MIN = 1;
export const PAYMENT_AMOUNT_MAX = 1_000_000;

export const KEEP_PAID_PAYMENTS_DAYS = 365;
export const KEEP_PENDING_PAYMENTS_DAYS = 7;
export const KEEP_HISTORY_DAYS = 365;

export const GIFTS_DAILY_LIMIT = 5;
export const GIFTS_CODE_EXPIRE_DAYS = 365;
export const GIFT_CODE_LENGTH = 12;
export const GIFT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const KEEP_RCON_COMMANDS_DAYS = 30;
export const KEEP_FOREVER = 0;

export const VK_LINK_PREFIX = 'https://vk.com/';

export const WEBHOOK_TIMEOUT_MS = 5000;
export const DISCORD_WEBHOOK_HOSTS = ['discord.com', 'discordapp.com'];
export const DISCORD_HTTPS_PROTOCOL = 'https:';
export const DISCORD_MESSAGES_PATH = '/messages/';
export const DISCORD_WAIT_PARAM = 'wait';

export const TELEGRAM_API_BASEURL = 'https://api.telegram.org';
export const TELEGRAM_ALLOWED_TAGS = ['b', 'i', 'u', 's', 'a', 'code', 'pre', 'blockquote'];

export const DISCORD_EMBED_TITLE_LIMIT = 256;
export const DISCORD_EMBED_DESCRIPTION_LIMIT = 4096;
export const TELEGRAM_MESSAGE_LIMIT = 4096;
export const TELEGRAM_CAPTION_LIMIT = 1024;
export const VK_MESSAGE_LIMIT = 4000;

export const WEBHOOK_MAX_ATTEMPTS = 5;
export const WEBHOOK_BACKOFF_BASE_MS = 60_000;
export const WEBHOOK_BACKOFF_MAX_MS = 60 * 60_000;
export const WEBHOOK_BATCH_LIMIT = 50;
export const WEBHOOK_STALE_MS = 5 * 60_000;
export const KEEP_WEBHOOK_DELIVERIES_DAYS = 90;
export const WEBHOOK_ERROR_MAX_LENGTH = 500;
export const WEBHOOK_TARGET_MAX_LENGTH = 120;

export const CURRENCY_DEFAULT_DECIMALS = 2;

export const MONEY_PRECISION = 16;
export const MONEY_SCALE = 4;

export const VOTE_MIN_INTERVAL_MS = 5 * 60_000;
export const VOTE_PLACE_MAX = 100;
export const VOTES_RECENT_MAX = 20;

export const PRICE_MIN = 0;
export const PRICE_MAX = 1_000_000_000;
export const SALE_MAX_PERCENT = 99;
export const BONUS_MAX_PERCENT = 100;
export const VIRTUAL_PERCENT_MAX = 100;

export const PERIOD_MULTIPLIER_MIN = 0.01;
export const PERIOD_MULTIPLIER_MAX = 1000;
export const PERIOD_EXPIRE_MAX = 100 * 365 * 24 * 60 * 60;

export const API_SERVER_FIELDS = ['server', 'server_id', 'serverId', 'from_server', 'servers'];

export const SCHEMA_LOCK_NAME = 'unicore_schema';
export const SCHEMA_LOCK_TIMEOUT = 60;
export const SCHEMA_LOCK_ATTEMPTS = 2;
export const SCHEMA_MIGRATIONS_TABLE = 'unicore_migrations';
