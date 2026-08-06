import { ValueTransformer } from 'typeorm';
import { CRYPTO_PURPOSE_FIELD } from '../constants';
import { decrypt, encrypt } from './crypto';

export const encryptedColumn = (aad: string): ValueTransformer => ({
  to: (value: string): string => (value == null || value === '' ? value : encrypt(value, CRYPTO_PURPOSE_FIELD, aad)),
  from: (value: string): string => (value == null || value === '' ? value : decrypt(value, CRYPTO_PURPOSE_FIELD, aad)),
});
