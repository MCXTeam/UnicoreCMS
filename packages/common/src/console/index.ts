import { WinstonModule } from "nest-winston";
import { transports } from "./transports";
import * as winston from "winston";

export const NestLogger = WinstonModule.createLogger({ transports });
export const Logger = winston.createLogger({ transports });
