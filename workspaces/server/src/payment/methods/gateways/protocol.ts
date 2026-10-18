import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Payment } from '../../entities/payment.entity';
import type { User } from '../../../admin/users/entities/user.entity';

export type GatewayHttp = (method: 'GET' | 'POST' | 'PUT', url: string, data?: unknown, headers?: Record<string, string>) => Promise<any>;
export interface CheckoutContext {
  payment: Payment;
  user: User;
  ip: string;
  callback: string;
  success: string;
  fail: string;
  resume: (token: string) => string;
  form: (token: string) => string;
}
export interface GatewayRequest { body: Record<string, any>; raw: Buffer; headers: Record<string, string>; ip: string; }
export interface GatewayCheckout { id?: string; link: string; data?: Record<string, string>; }
export interface Confirmation {
  orderId?: string;
  providerId?: string;
  transactionId?: string;
  amount?: unknown;
  currency?: string;
  paid?: boolean;
  productId?: string;
  userId?: string;
  prerequest?: boolean;
  response?: unknown;
}
export interface Gateway {
  create(context: CheckoutContext, http: GatewayHttp): Promise<GatewayCheckout>;
  verify(request: GatewayRequest, http: GatewayHttp): Promise<Confirmation>;
  resume?(context: CheckoutContext, http: GatewayHttp): Promise<GatewayCheckout>;
  form?(context: CheckoutContext): { action: string; fields: Record<string, string> };
}

export const hash = (algorithm: string, value: string | Buffer) => createHash(algorithm).update(value).digest('hex');
export const hmac = (value: string | Buffer, key: string, encoding: 'hex' | 'base64' = 'hex') => createHmac('sha256', key).update(value).digest(encoding);
export function equal(left: unknown, right: string): boolean {
  if (typeof left !== 'string' || !left || !right) return false;
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function assertGateway(condition: unknown): asserts condition { if (!condition) throw new Error('Invalid payment notification'); }
export const basic = (id: string, secret: string) => ({ Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}` });
export const phpJson = (value: unknown) => JSON.stringify(value).replace(/\//g, '\\/').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export const sorted = (value: Record<string, any>) => Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]));
export const rfc3986 = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
export function fieldsOnly(body: Record<string, any>): Record<string, string> {
  assertGateway(body && typeof body === 'object' && !Array.isArray(body));
  assertGateway(Object.values(body).every((value) => typeof value === 'string'));
  return body;
}
export function checkoutUrl(value: unknown): string {
  assertGateway(typeof value === 'string');
  const url = new URL(value);
  assertGateway(url.protocol === 'https:' && !url.username && !url.password);
  return url.href;
}
export const decimal = (context: CheckoutContext) => Number(context.payment.provider_amount).toFixed(2);
export const description = (context: CheckoutContext) => `Balance #${context.payment.id} (${context.user.username})`;
