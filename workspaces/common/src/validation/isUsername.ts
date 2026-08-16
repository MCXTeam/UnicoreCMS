import { USERNAME_PATTERN } from "../constants";

export { IS_USERNAME } from "../constants";

/**
 * Проверяет, является ли строка логином.
 * Если заданное значение не является строкой, то оно возвращает значение false.
 */
export function isUsername(value: unknown): boolean {
  return typeof value === "string" && USERNAME_PATTERN.test(value);
}
