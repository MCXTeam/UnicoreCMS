import * as clc from "cli-color";
import bare from "cli-color/bare";
import safeStringify from "fast-safe-stringify";
import { Format } from "logform";
import { NestLikeConsoleFormatOptions } from "nest-winston";
import { inspect } from "util";
import { format } from "winston";

const ColorScheme: Record<string, bare.Format> = {
  info: clc.green,
  error: clc.red,
  warn: clc.yellow,
  debug: clc.magentaBright,
  verbose: clc.cyanBright,
};

export const ConsoleFormat = (
  appName = "NestWinston",
  options?: NestLikeConsoleFormatOptions
): Format =>
  format.printf(({ context, level, timestamp, message, ms, ...meta }) => {
    if (typeof timestamp !== "undefined") {
      // Only format the timestamp to a locale representation if it's ISO 8601 format. Any format
      // that is not a valid date string will throw, just ignore it (it will be printed as-is).
      try {
        if (timestamp === new Date(timestamp).toISOString()) {
          timestamp = new Date(timestamp).toLocaleString();
        }
      } catch (error) {
        // eslint-disable-next-line no-empty
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const color = ColorScheme[level] || ((text: string): string => text);

    const stringifiedMeta = safeStringify(meta);
    const formattedMeta = options?.prettyPrint
      ? inspect(JSON.parse(stringifiedMeta), { colors: true, depth: null })
      : stringifiedMeta;

    return (
      //`${color(`[${appName}]`)} ` +
      `${clc.yellow(level.charAt(0).toUpperCase() + level.slice(1))}\t${
        typeof timestamp !== "undefined" ? `${timestamp} ` : ""
      }${
        typeof context !== "undefined" ? `${clc.yellow(`[${context}]`)} ` : ""
      }${color(message)}${
        Object.keys(meta).length !== 0 ? ` - ${formattedMeta}` : ""
      }${typeof ms !== "undefined" ? ` ${clc.yellow(ms)}` : ""}`
    );
  });
