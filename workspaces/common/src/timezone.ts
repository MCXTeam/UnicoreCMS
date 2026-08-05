export const DEFAULT_TIMEZONE = "UTC";

export const isValidTimezone = (timezone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

export const timezoneOffset = (
  timezone: string,
  at: Date = new Date(),
): string => {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;

  const offset = formatted?.replace("GMT", "").trim();

  return offset ? offset : "+00:00";
};
