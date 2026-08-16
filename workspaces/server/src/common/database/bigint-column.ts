import { ValueTransformer } from 'typeorm';

export const bigintColumn: ValueTransformer = {
  to: (value?: number | null) => (value == null ? null : String(value)),
  from: (value?: string | number | null) => (value == null ? null : Number(value)),
};
