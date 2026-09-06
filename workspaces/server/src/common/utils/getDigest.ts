import { StorageManager } from '@common';
import * as crypto from 'crypto';

export function getDigest(file: string | Buffer): string | null {
  if (!file) return null;

  const content = typeof file === 'string' ? StorageManager.read(file) : file;

  if (!content) return null;

  return Buffer.from(crypto.createHash('md5').update(content).digest('hex')).toString('base64');
}
