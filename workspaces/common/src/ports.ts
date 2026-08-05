import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { config, parse } from "dotenv";

export const DEFAULT_CLIENT_PORT = 3000;
export const DEFAULT_ADMIN_PORT = 4000;
export const DEFAULT_BACKEND_PORT = 5000;

export const CLIENT_PORT_KEYS = ["CLIENT_PORT"];
export const ADMIN_PORT_KEYS = ["ADMIN_PORT"];
export const BACKEND_PORT_KEYS = ["BACKEND_PORT", "SERVER_PORT"];

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

const toPort = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const port = Number(value.trim());
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : undefined;
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
