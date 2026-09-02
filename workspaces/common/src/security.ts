import { randomBytes } from "node:crypto";
import {
  CSP_NONCE_BYTES,
  CSP_SCRIPT_TAG_PATTERN,
  CSP_WEBSOCKET_PROTOCOL,
  HTTPS_PROTOCOL,
  SECURITY_STATIC_HEADERS,
} from "./constants";

export {
  CONTENT_SECURITY_POLICY_HEADER,
  SECURITY_STRIPPED_HEADERS,
} from "./constants";

export interface SecurityOptions {
  nonce: string;
  apiBaseurl: string;
  telemetry?: boolean;
  externalImages?: boolean;
}

export function generateNonce(): string {
  return randomBytes(CSP_NONCE_BYTES).toString("base64");
}

export function applyNonce(html: string, nonce: string): string {
  return html.replace(CSP_SCRIPT_TAG_PATTERN, `<script nonce="${nonce}"`);
}

function websocketOrigin(apiBaseurl: string): string {
  try {
    const url = new URL(apiBaseurl);

    return `${CSP_WEBSOCKET_PROTOCOL}${url.protocol === HTTPS_PROTOCOL ? "s" : ""}://${url.host}`;
  } catch {
    return "";
  }
}

export function contentSecurityPolicy(options: SecurityOptions): string {
  const api = options.apiBaseurl;
  const socket = websocketOrigin(api);
  const anywhere = `${HTTPS_PROTOCOL}`;

  const images = ["'self'", "data:", "blob:", api];
  const connect = ["'self'", api, socket];

  if (options.externalImages) images.push(anywhere);
  if (options.telemetry) connect.push(anywhere);

  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'nonce-${options.nonce}' 'strict-dynamic' ${anywhere} 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${images.filter(Boolean).join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connect.filter(Boolean).join(" ")}`,
  ].join("; ");
}

export function securityHeaders(): Record<string, string> {
  return { ...SECURITY_STATIC_HEADERS };
}
