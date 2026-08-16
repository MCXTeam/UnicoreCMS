import { ValueTransformer } from 'typeorm';

export const decimalColumn: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) => (value == null ? value : Number(value)),
};
