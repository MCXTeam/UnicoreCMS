import { format } from "winston";
import { LOG_REDACTED, LOG_REDACT_DEPTH, LOG_REDACT_KEYS } from "../constants";

const isSensitive = (key: string): boolean =>
  LOG_REDACT_KEYS.includes(key.toLowerCase());

const redactValue = (
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown => {
  if (depth > LOG_REDACT_DEPTH || value === null || typeof value !== "object")
    return value;

  if (seen.has(value as object)) return value;
  seen.add(value as object);

  if (Array.isArray(value))
    return value.map((item) => redactValue(item, depth + 1, seen));

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(source))
    result[key] = isSensitive(key)
      ? LOG_REDACTED
      : redactValue(source[key], depth + 1, seen);

  return result;
};

export const redactFormat = format((info) => {
  const seen = new WeakSet<object>();

  for (const key of Object.keys(info)) {
    if (isSensitive(key)) info[key] = LOG_REDACTED;
    else info[key] = redactValue(info[key], 0, seen);
  }

  return info;
});
