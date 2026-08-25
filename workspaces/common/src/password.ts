export const GENERATED_PASSWORD_LENGTH = 16;

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!?@#$%&*+-=";

export function generatePassword(length: number = GENERATED_PASSWORD_LENGTH): string {
  const source = globalThis.crypto;

  if (!source?.getRandomValues) throw new Error("Генератор случайных чисел недоступен");

  const bytes = new Uint32Array(length);

  source.getRandomValues(bytes);

  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}
