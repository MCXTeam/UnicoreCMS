import {
  DURATION_LOCALE_FALLBACK,
  DURATION_UNITS,
  DURATION_UNIT_SECONDS,
} from "./constants";

export type DurationUnit = keyof typeof DURATION_UNIT_SECONDS;
export type DurationLocale = keyof (typeof DURATION_UNITS)[number]["forms"];

const PLURAL_INDEX: Record<DurationLocale, (value: number) => number> = {
  ru: (value) => {
    const tens = value % 100;
    const ones = value % 10;

    if (ones === 1 && tens !== 11) return 0;
    if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return 1;

    return 2;
  },
  en: (value) => (value === 1 ? 0 : 1),
};

function resolveLocale(locale: string): DurationLocale {
  return locale in PLURAL_INDEX
    ? (locale as DurationLocale)
    : (DURATION_LOCALE_FALLBACK as DurationLocale);
}

export function formatDuration(
  value: number,
  unit: DurationUnit = "minutes",
  locale = "ru",
): string {
  const code = resolveLocale(locale);
  let rest = Math.max(
    0,
    Math.floor(Number(value || 0) * DURATION_UNIT_SECONDS[unit]),
  );

  const parts: string[] = [];

  for (const { seconds, forms } of DURATION_UNITS) {
    const count = Math.floor(rest / seconds);

    rest -= count * seconds;

    if (count) parts.push(`${count} ${forms[code][PLURAL_INDEX[code](count)]}`);
  }

  const smallest = DURATION_UNITS[DURATION_UNITS.length - 1].forms[code];

  return parts.length
    ? parts.join(", ")
    : `0 ${smallest[PLURAL_INDEX[code](0)]}`;
}
