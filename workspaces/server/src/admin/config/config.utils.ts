import { configNumber } from '@common';
import { CONFIG_NUMBER_RULES } from './config.constants';
import { ConfigField } from './config.enum';

export function configFieldNumber(config: Record<string, unknown>, field: ConfigField): number {
  const rule = CONFIG_NUMBER_RULES[field];

  if (!rule) return configNumber(config, field, 0);

  return configNumber(config, field, rule.fallback, rule.min, rule.max);
}

export function isValidConfigNumber(field: string, value: unknown): boolean {
  const rule = CONFIG_NUMBER_RULES[field as ConfigField];
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return false;
  if (!rule) return true;

  return parsed >= rule.min && parsed <= rule.max;
}
