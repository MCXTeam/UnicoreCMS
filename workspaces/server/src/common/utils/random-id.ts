import { randomBytes } from 'crypto';
import { RANDOM_ID_ALPHABET, RANDOM_ID_LENGTH } from '../constants';

export function randomFromAlphabet(alphabet: string, size: number): string {
  const mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1;
  const step = Math.ceil((1.6 * mask * size) / alphabet.length);

  let id = '';

  while (id.length < size) {
    const bytes = randomBytes(step);

    for (let index = 0; index < step && id.length < size; index++) {
      const position = bytes[index] & mask;

      if (position < alphabet.length) id += alphabet[position];
    }
  }

  return id;
}

export function randomId(size: number = RANDOM_ID_LENGTH): string {
  return randomFromAlphabet(RANDOM_ID_ALPHABET, size);
}
