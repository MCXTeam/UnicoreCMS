import { StorageManager } from '@common';
import * as crypto from 'crypto';

export function getDeigest(file: string | Buffer): string | null {
  if (!file) return null;

  if (typeof file === 'string') {
    file = StorageManager.read(file);
  }

  const digest = crypto.createHash('md5').setEncoding('base64').update(file).end();

  return digest.read();
}
