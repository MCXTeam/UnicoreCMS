import type { Logger } from "winston";

type LogMeta = Record<string, unknown>;

function structured(message: unknown): LogMeta | null {
  return !!message && typeof message === "object" && !(message instanceof Error)
    ? { ...(message as LogMeta) }
    : null;
}

export class WinstonLogger {
  constructor(private readonly logger: Logger) {}

  log(message: unknown, context?: string): void {
    const object = structured(message);

    if (!object) return this.write("info", message, context);

    const { message: text, level, ...meta } = object;

    this.write(typeof level === "string" ? level : "info", text, context, meta);
  }

  warn(message: unknown, context?: string): void {
    this.leveled("warn", message, context);
  }

  debug(message: unknown, context?: string): void {
    this.leveled("debug", message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.leveled("verbose", message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    if (message instanceof Error) {
      const {
        name,
        message: text,
        stack,
        ...meta
      } = message as Error & LogMeta;

      return this.write("error", text, context, {
        stack: [trace ?? stack],
        error: message,
        ...meta,
      });
    }

    const object = structured(message);

    if (!object)
      return this.write("error", message, context, { stack: [trace] });

    const { message: text, ...meta } = object;

    this.write("error", text, context, { stack: [trace], ...meta });
  }

  fatal(message: unknown, trace?: string, context?: string): void {
    this.error(message, trace, context);
  }

  private leveled(level: string, message: unknown, context?: string): void {
    const object = structured(message);

    if (!object) return this.write(level, message, context);

    const { message: text, ...meta } = object;

    this.write(level, text, context, meta);
  }

  private write(
    level: string,
    message: unknown,
    context?: string,
    meta?: LogMeta,
  ): void {
    this.logger.log(level, message as string, { context, ...meta });
  }
}
