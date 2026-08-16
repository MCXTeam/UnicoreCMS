import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { config, parse } from "dotenv";
import {
  ADMIN_PORT_KEYS,
  BACKEND_PORT_KEYS,
  CLIENT_PORT_KEYS,
  DEFAULT_ADMIN_PORT,
  DEFAULT_BACKEND_PORT,
  DEFAULT_CLIENT_PORT,
  MAX_PORT,
  MIN_PORT,
  PUBLIC_ENV_KEYS,
} from "./constants";

const processEnv: NodeJS.ProcessEnv =
  typeof process !== "undefined" && process.env ? process.env : {};

const isNodeRuntime =
  typeof process !== "undefined" && Boolean(process.versions?.node);

const locateEnvFile = (): string => {
  const fallback = resolve(".env");
  if (!isNodeRuntime) return fallback;

  let dir = process.cwd();
  for (;;) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return fallback;
    dir = parent;
  }
};

export const envFilePath = locateEnvFile();

export const projectRoot = dirname(envFilePath);
export const storagePath = resolve(projectRoot, "storage");

export const loadEnvFile = (): void => {
  config({ path: envFilePath });
};

const readEnvFile = (): Record<string, string> => {
  if (!isNodeRuntime) return {};
  try {
    return parse(readFileSync(envFilePath));
  } catch {
    return {};
  }
};

const envFile = readEnvFile();

export const loadPublicEnvFile = (): void => {
  if (!isNodeRuntime) return;

  for (const key of PUBLIC_ENV_KEYS) {
    const value = envFile[key];
    if (value !== undefined && processEnv[key] === undefined)
      processEnv[key] = value;
  }
};

const toPort = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const port = Number(value.trim());
  return Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT
    ? port
    : undefined;
};

const readPort = (keys: string[]): number | undefined => {
  for (const key of keys) {
    const port = toPort(envFile[key]);
    if (port) return port;
  }
  for (const key of keys) {
    const port = toPort(processEnv[key]);
    if (port) return port;
  }
  return undefined;
};

export interface ConfiguredPorts {
  frontend?: number;
  admin?: number;
  backend?: number;
}

export interface Ports {
  frontendPort: number;
  adminPort: number;
  backendPort: number;
}

export const configuredPorts: ConfiguredPorts = {
  frontend: readPort(CLIENT_PORT_KEYS),
  admin: readPort(ADMIN_PORT_KEYS),
  backend: readPort(BACKEND_PORT_KEYS),
};

export const ports: Ports = {
  frontendPort: configuredPorts.frontend ?? DEFAULT_CLIENT_PORT,
  adminPort: configuredPorts.admin ?? DEFAULT_ADMIN_PORT,
  backendPort: configuredPorts.backend ?? DEFAULT_BACKEND_PORT,
};
