import { ValueTransformer } from 'typeorm';
import { CRYPTO_PURPOSE_FIELD } from '../constants';
import { decrypt, encrypt } from './crypto';

export const fieldAad = (field: string, id: string): string => `${field}:${id}`;

export const encryptedColumn = (aad: string): ValueTransformer => ({
  to: (value: string): string => (value == null || value === '' ? value : encrypt(value, CRYPTO_PURPOSE_FIELD, aad)),
  from: (value: string): string => (value == null || value === '' ? value : decrypt(value, CRYPTO_PURPOSE_FIELD, aad)),
});

export function encryptField(value: string, field: string, id: string): string {
  if (value == null || value === '') return value;

  return encrypt(value, CRYPTO_PURPOSE_FIELD, fieldAad(field, id));
}

export function decryptField(value: string, field: string, id: string): string {
  if (value == null || value === '') return value;

  try {
    return decrypt(value, CRYPTO_PURPOSE_FIELD, fieldAad(field, id));
  } catch {
    return decrypt(value, CRYPTO_PURPOSE_FIELD, field);
  }
}
