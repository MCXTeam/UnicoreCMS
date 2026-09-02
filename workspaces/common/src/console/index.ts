import { transports } from "./transports";
import { WinstonLogger } from "./logger";
import * as winston from "winston";

export const Logger = winston.createLogger({ transports });
export const NestLogger = new WinstonLogger(Logger);
