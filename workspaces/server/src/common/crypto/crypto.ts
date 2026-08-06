import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, timingSafeEqual } from 'crypto';
import { envConfig } from 'unicore-common';
import {
  CRYPTO_CIPHER,
  CRYPTO_HKDF_HASH,
  CRYPTO_HKDF_SALT,
  CRYPTO_IV_BYTES,
  CRYPTO_KEY_BYTES,
  CRYPTO_PREFIX,
  CRYPTO_TAG_BYTES,
  CRYPTO_VERSION,
} from '../constants';

const deriveKey = (master: string, purpose: string): Buffer =>
  Buffer.from(hkdfSync(CRYPTO_HKDF_HASH, Buffer.from(master), Buffer.from(CRYPTO_HKDF_SALT), Buffer.from(purpose), CRYPTO_KEY_BYTES));

const keyCache = new Map<string, Buffer>();

const keyFor = (purpose: string, master: string): Buffer => {
  const cacheKey = `${purpose}:${master.length}:${master.slice(0, 4)}`;
  const cached = keyCache.get(cacheKey);

  if (cached) return cached;

  const key = deriveKey(master, purpose);
  keyCache.set(cacheKey, key);

  return key;
};

export const isEncrypted = (value: string): boolean => typeof value === 'string' && value.startsWith(`${CRYPTO_PREFIX}:`);

export const encryptedVersion = (value: string): number => (isEncrypted(value) ? Number(value.split(':')[1]) : 0);

export function encrypt(plain: string, purpose: string, aad: string): string {
  const iv = randomBytes(CRYPTO_IV_BYTES);
  const cipher = createCipheriv(CRYPTO_CIPHER, keyFor(purpose, envConfig.encryptionKey), iv);

  cipher.setAAD(Buffer.from(aad));

  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const payload = Buffer.concat([iv, cipher.getAuthTag(), encrypted]);

  return `${CRYPTO_PREFIX}:${CRYPTO_VERSION}:${payload.toString('base64')}`;
}

function decryptWith(value: string, purpose: string, aad: string, master: string): string {
  const payload = Buffer.from(value.split(':')[2], 'base64');
  const iv = payload.subarray(0, CRYPTO_IV_BYTES);
  const tag = payload.subarray(CRYPTO_IV_BYTES, CRYPTO_IV_BYTES + CRYPTO_TAG_BYTES);
  const encrypted = payload.subarray(CRYPTO_IV_BYTES + CRYPTO_TAG_BYTES);

  const decipher = createDecipheriv(CRYPTO_CIPHER, keyFor(purpose, master), iv);

  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function decrypt(value: string, purpose: string, aad: string): string {
  if (!isEncrypted(value)) return value;

  try {
    return decryptWith(value, purpose, aad, envConfig.encryptionKey);
  } catch (error) {
    if (!envConfig.encryptionKeyPrevious) throw error;

    return decryptWith(value, purpose, aad, envConfig.encryptionKeyPrevious);
  }
}

export function isCurrentKey(value: string, purpose: string, aad: string): boolean {
  if (!isEncrypted(value)) return false;
  if (encryptedVersion(value) !== CRYPTO_VERSION) return false;

  try {
    decryptWith(value, purpose, aad, envConfig.encryptionKey);
    return true;
  } catch {
    return false;
  }
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left ?? '');
  const b = Buffer.from(right ?? '');

  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
