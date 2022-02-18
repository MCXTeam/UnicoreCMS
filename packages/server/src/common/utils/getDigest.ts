import { StorageManager } from '@common';
import * as crypto from 'crypto';

export function getDeigest(file: string | Buffer): string | null {
  if (!file) return null;

  if (typeof file === 'string') {
    file = StorageManager.read(file);
  }

  const digest = crypto.createHash('sha1');
  digest.setEncoding('hex');
  digest.write(file);
  digest.end();

  return digest.read();
}
