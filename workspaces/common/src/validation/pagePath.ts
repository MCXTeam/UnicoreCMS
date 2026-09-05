export const PAGE_PATH_MAX_LENGTH = 120;

export const PAGE_PATH_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function isPagePath(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.length <= PAGE_PATH_MAX_LENGTH &&
    PAGE_PATH_PATTERN.test(value)
  );
}
