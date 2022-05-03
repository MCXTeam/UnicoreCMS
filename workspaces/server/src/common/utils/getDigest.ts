import { StorageManager } from '@common';
import * as crypto from 'crypto';

export function getDeigest(file: string | Buffer): string | null {
  if (!file) return null;

  if (typeof file === 'string') {
    file = StorageManager.read(file);
  }

  const digest = Buffer.from(crypto.createHash("md5").update(file).digest("hex")).toString("base64");

  return digest;
}
