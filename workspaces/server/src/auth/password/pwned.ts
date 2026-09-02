import { createHash } from 'crypto';
import {
  PWNED_FIELD_SEPARATOR,
  PWNED_HASH,
  PWNED_LINE_SEPARATOR,
  PWNED_PREFIX_LENGTH,
  PWNED_RANGE_URL,
} from '@common';

export interface PwnedRange {
  prefix: string;
  suffix: string;
  url: string;
}

export function pwnedRange(password: string): PwnedRange {
  const digest = createHash(PWNED_HASH).update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = digest.slice(0, PWNED_PREFIX_LENGTH);

  return { prefix, suffix: digest.slice(PWNED_PREFIX_LENGTH), url: `${PWNED_RANGE_URL}${prefix}` };
}

export function pwnedCount(body: string, suffix: string): number {
  for (const line of String(body).split(PWNED_LINE_SEPARATOR)) {
    const [candidate, count] = line.trim().split(PWNED_FIELD_SEPARATOR);

    if (candidate?.toUpperCase() === suffix) return Number(count) || 0;
  }

  return 0;
}
