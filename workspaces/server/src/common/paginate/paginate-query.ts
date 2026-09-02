import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import {
  PAGINATE_FILTER_PATTERN,
  PAGINATE_SORT_DIRECTIONS,
  PAGINATE_SORT_PATTERN,
  PAGINATE_SORT_SEPARATOR,
  PaginateSortDirection,
} from '../constants';

export type PaginateSort = [string, PaginateSortDirection];

export interface PaginateQuery {
  page?: number;
  limit?: number;
  sortBy?: PaginateSort[];
  search?: string;
  filter?: Record<string, string | string[]>;
  path: string;
}

type Query = Record<string, unknown>;

function positive(value: unknown): number | undefined {
  const parsed = Number(Array.isArray(value) ? value[0] : value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

function toSort(entry: unknown): PaginateSort | null {
  const [column, direction] = Array.isArray(entry)
    ? [String(entry[0] ?? ''), String(entry[1] ?? '')]
    : String(entry ?? '').split(PAGINATE_SORT_SEPARATOR);

  const normalized = String(direction ?? '').toUpperCase();

  if (!column || !PAGINATE_SORT_DIRECTIONS.includes(normalized)) return null;

  return [column, normalized as PaginateSortDirection];
}

function bracketedSorting(query: Query): PaginateSort[] {
  const pairs: string[][] = [];

  for (const [key, value] of Object.entries(query)) {
    const match = key.match(PAGINATE_SORT_PATTERN);

    if (!match) continue;

    const [, index, position] = match;

    pairs[Number(index)] ??= [];
    pairs[Number(index)][Number(position)] = String(value);
  }

  return pairs.map(toSort).filter(Boolean) as PaginateSort[];
}

function sorting(query: Query): PaginateSort[] | undefined {
  const direct = query.sortBy;
  const entries = Array.isArray(direct) ? direct : direct === undefined ? [] : [direct];
  const parsed = [...(entries.map(toSort).filter(Boolean) as PaginateSort[]), ...bracketedSorting(query)];

  return parsed.length ? parsed : undefined;
}

function filters(query: Query): Record<string, string | string[]> | undefined {
  const collected: Record<string, string | string[]> = {};

  const nested = query.filter;

  if (nested && typeof nested === 'object' && !Array.isArray(nested))
    for (const [column, value] of Object.entries(nested as Query))
      if (typeof value === 'string' || Array.isArray(value)) collected[column] = value as string | string[];

  for (const [key, value] of Object.entries(query)) {
    const match = key.match(PAGINATE_FILTER_PATTERN);

    if (!match) continue;
    if (typeof value !== 'string' && !Array.isArray(value)) continue;

    collected[match[1]] = value as string | string[];
  }

  return Object.keys(collected).length ? collected : undefined;
}

export function parsePaginateQuery(request: Request): PaginateQuery {
  const query = (request.query ?? {}) as Query;
  const search = query.search;

  return {
    page: positive(query.page),
    limit: positive(query.limit),
    sortBy: sorting(query),
    search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
    filter: filters(query),
    path: (request.originalUrl ?? request.url ?? '').split('?')[0],
  };
}

export const Paginate = createParamDecorator((data: unknown, ctx: ExecutionContext): PaginateQuery =>
  parsePaginateQuery(ctx.switchToHttp().getRequest()),
);
