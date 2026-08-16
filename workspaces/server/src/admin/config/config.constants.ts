import { KEEP_HISTORY_DAYS, KEEP_PAID_PAYMENTS_DAYS, KEEP_PENDING_PAYMENTS_DAYS } from '@common';
import { ConfigField } from './config.enum';

export const CONFIG_AMOUNT_MAX = 1_000_000_000;
export const CONFIG_DAYS_MAX = 36500;
export const CONFIG_PERCENT_MAX = 100;
export const CONFIG_RATE_MIN = 0.000001;

export interface ConfigNumberRule {
  fallback: number;
  min: number;
  max: number;
}

export const CONFIG_NUMBER_RULES: Partial<Record<ConfigField, ConfigNumberRule>> = {
  [ConfigField.EconomyRate]: { fallback: 100, min: CONFIG_RATE_MIN, max: CONFIG_AMOUNT_MAX },
  [ConfigField.ReferalTrigger]: { fallback: 600, min: 0, max: CONFIG_AMOUNT_MAX },
  [ConfigField.ReferalReward]: { fallback: 20, min: 0, max: CONFIG_AMOUNT_MAX },
  [ConfigField.ReferalRewardPlayer]: { fallback: 20, min: 0, max: CONFIG_AMOUNT_MAX },
  [ConfigField.MonitoringReward]: { fallback: 2, min: 0, max: CONFIG_AMOUNT_MAX },
  [ConfigField.UnbanPrice]: { fallback: 150, min: 0, max: CONFIG_AMOUNT_MAX },
  [ConfigField.VirtualPercent]: { fallback: 75, min: 0, max: CONFIG_PERCENT_MAX },
  [ConfigField.KeepPaidPaymentsDays]: { fallback: KEEP_PAID_PAYMENTS_DAYS, min: 0, max: CONFIG_DAYS_MAX },
  [ConfigField.KeepPendingPaymentsDays]: { fallback: KEEP_PENDING_PAYMENTS_DAYS, min: 0, max: CONFIG_DAYS_MAX },
  [ConfigField.KeepHistoryDays]: { fallback: KEEP_HISTORY_DAYS, min: 0, max: CONFIG_DAYS_MAX },
};

export const CONFIG_CACHE_TTL_MS = 30_000;
