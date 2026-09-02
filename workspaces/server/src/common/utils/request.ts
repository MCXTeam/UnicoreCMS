import { QUERY_SEPARATOR } from '../constants';

export interface RequestLike {
  originalUrl?: string;
  url?: string;
  body?: Record<string, any>;
}

export function requestPath(request: RequestLike): string {
  return String(request.originalUrl || request.url || '').split(QUERY_SEPARATOR)[0];
}

export function requestBodyString(source: unknown, field: string): string {
  const value = (source as Record<string, unknown> | null | undefined)?.[field];

  return typeof value === 'string' ? value.trim() : '';
}
