export { IS_USERNAME } from "../constants";

/**
 * Проверяет, является ли строка логином.
 * Если заданное значение не является строкой, то оно возвращает значение false.
 */
export function isUsername(value: unknown): boolean {
  return (
    typeof value === "string" && value.match(/^[a-z0-9_-]{3,16}$/gim) !== null
  );
}
