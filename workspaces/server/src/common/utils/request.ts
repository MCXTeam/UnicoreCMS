import { QUERY_SEPARATOR } from '../constants';

export interface RequestLike {
  originalUrl?: string;
  url?: string;
  body?: Record<string, any>;
}

export function requestPath(request: RequestLike): string {
  return String(request.originalUrl || request.url || '').split(QUERY_SEPARATOR)[0];
}

export function requestBodyString(request: RequestLike, field: string): string {
  const value = request.body?.[field];

  return typeof value === 'string' ? value.trim() : '';
}
