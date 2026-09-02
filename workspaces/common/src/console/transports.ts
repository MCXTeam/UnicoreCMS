import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import * as winston from "winston";
import { ConsoleFormat } from "./format";
import { redactFormat } from "./redact";
import { envFilePath } from "../ports";
import {
  LOG_DIR_MODE,
  LOG_DIR_NAME,
  LOG_ERROR_FILE_NAME,
  LOG_FILE_MODE,
} from "../constants";

const logDir = resolve(dirname(envFilePath), LOG_DIR_NAME);

mkdirSync(logDir, { recursive: true, mode: LOG_DIR_MODE });

const consoleFormat = winston.format.combine(
  redactFormat(),
  winston.format.timestamp(),
  winston.format.ms(),
  ConsoleFormat({ prettyPrint: true }),
);

const fileFormat = winston.format.combine(
  redactFormat(),
  winston.format.timestamp(),
  winston.format.json(),
);

export const transports = [
  new winston.transports.Console({ format: consoleFormat, eol: "" }),
  new winston.transports.File({
    filename: resolve(logDir, LOG_ERROR_FILE_NAME),
    level: "error",
    format: fileFormat,
    options: { flags: "a", mode: LOG_FILE_MODE },
  }),
];
