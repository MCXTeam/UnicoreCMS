import { randomInt } from 'crypto';
import { SEED_LOREM_WORDS, SEED_NAME_PARTS, SEED_TEXT_MAX_WORDS, SEED_TEXT_MIN_WORDS } from './constants';

function pick<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

export function fakeText(): string {
  const length = SEED_TEXT_MIN_WORDS + randomInt(SEED_TEXT_MAX_WORDS - SEED_TEXT_MIN_WORDS);
  const words = Array.from({ length }, () => pick(SEED_LOREM_WORDS));

  return words.join(' ').replace(/^./, (letter) => letter.toUpperCase()) + '.';
}

export function fakeUsername(): string {
  return `${pick(SEED_NAME_PARTS)}${pick(SEED_NAME_PARTS)}${randomInt(1000)}`;
}

export function fakeEmail(username: string): string {
  return `${username.toLowerCase()}@example.com`;
}

export function fakePassword(): string {
  return `${pick(SEED_NAME_PARTS)}-${pick(SEED_NAME_PARTS)}-${randomInt(100000, 999999)}`;
}

export function fakeBoolean(): boolean {
  return randomInt(2) === 1;
}
