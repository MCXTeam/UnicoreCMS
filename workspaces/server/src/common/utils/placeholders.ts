export function fillPlaceholders(
  content: string,
  values: Record<string, string | number>,
  transform: (value: string) => string = (value) => value,
): string {
  return Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(transform(String(value))), content);
}
