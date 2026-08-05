export const ASCII_NAME =
  " __  __                                          ____              ____       \r\n/\\ \\/\\ \\          __                            /\\  _`\\    /'\\_/`\\/\\  _`\\     \r\n\\ \\ \\ \\ \\    ___ /\\_\\    ___    ___   _ __    __\\ \\ \\/\\_\\ /\\      \\ \\,\\L\\_\\   \r\n \\ \\ \\ \\ \\ /' _ `\\/\\ \\  /'___\\ / __`\\/\\`'__\\/'__`\\ \\ \\/_/_\\ \\ \\__\\ \\/_\\__ \\   \r\n  \\ \\ \\_\\ \\/\\ \\/\\ \\ \\ \\/\\ \\__//\\ \\L\\ \\ \\ \\//\\  __/\\ \\ \\L\\ \\\\ \\ \\_/\\ \\/\\ \\L\\ \\ \r\n   \\ \\_____\\ \\_\\ \\_\\ \\_\\ \\____\\ \\____/\\ \\_\\\\ \\____\\\\ \\____/ \\ \\_\\\\ \\_\\ `\\____\\\r\n    \\/_____/\\/_/\\/_/\\/_/\\/____/\\/___/  \\/_/ \\/____/ \\/___/   \\/_/ \\/_/\\/_____/";

export const TOTP_WINDOW = 1;

export const REFRESH_ROTATION_LEEWAY_MS = 30_000;

export const WS_API_KEY_PREFIX = 'Api-Key ';
export const WS_BEARER_PREFIX = 'Bearer ';
export const WS_PUBLIC_ROOM = 'public';

export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSIONS_KEY = 'permissions';

export const STORAGE_MAX_IMAGE_UPLOAD = 2 * 1024 * 1024;
export const STORAGE_MAX_REMOTE_DOWNLOAD = 10 * 1024 * 1024;

export const RCON_MAX_ATTEMPTS = 8;
export const RCON_BACKOFF_BASE_MS = 30_000;
export const RCON_BACKOFF_MAX_MS = 30 * 60_000;
export const RCON_BATCH_LIMIT = 200;
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

export const THROTTLE_REGISTER = { ttl: 60 * 60_000, limit: 5 };
export const THROTTLE_VERIFY = { ttl: 10 * 60_000, limit: 10 };
export const THROTTLE_RESEND = { ttl: 10 * 60_000, limit: 3 };
export const THROTTLE_PASSWORD_RESET = { ttl: 60 * 60_000, limit: 5 };

export const VK_LINK_PREFIX = 'https://vk.com/';

export const PRICE_MIN = 0;
export const BONUS_MAX_PERCENT = 100;
