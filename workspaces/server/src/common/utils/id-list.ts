export function toIdList(value: unknown): number[] {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.map(Number).filter(Number.isInteger);

  return String(value)
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Number.isInteger);
}
