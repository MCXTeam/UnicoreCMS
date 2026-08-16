import { ValueTransformer } from 'typeorm';

function parse(value: string | null): string[] {
  if (!value) return [];

  const raw = value.trim();

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      return [];
    }
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const stringArrayColumn: ValueTransformer = {
  to: (value?: string[] | null) => (value?.length ? JSON.stringify(value) : null),
  from: (value?: string | null) => parse(value),
};
