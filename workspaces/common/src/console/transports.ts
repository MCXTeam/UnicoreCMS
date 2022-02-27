import * as winston from "winston";
import { ConsoleFormat } from "./format";

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.ms(),
  ConsoleFormat("UnicoreServer", { prettyPrint: true })
);

export const transports = [
  new winston.transports.Console({ format }),
  new winston.transports.File({
    filename: "../../logs/error.log",
    level: "error",
  }),
];
