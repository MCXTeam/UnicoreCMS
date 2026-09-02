import { Brackets, FindOptionsWhere, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import {
  PAGINATE_BETWEEN_SEPARATOR,
  PAGINATE_DEFAULT_ALIAS,
  PAGINATE_DEFAULT_LIMIT,
  PAGINATE_FILTER_SEPARATOR,
  PAGINATE_MAX_LIMIT,
  PAGINATE_OPERATORS,
  PaginateSortDirection,
} from '../constants';
import { PaginateQuery, PaginateSort } from './paginate-query';

export enum FilterOperator {
  EQ = '$eq',
  GT = '$gt',
  GTE = '$gte',
  LT = '$lt',
  LTE = '$lte',
  BTW = '$btw',
}

export interface PaginateConfig<T> {
  sortableColumns: string[];
  searchableColumns?: string[];
  filterableColumns?: Record<string, FilterOperator[]>;
  defaultSortBy?: PaginateSort[];
  defaultLimit?: number;
  maxLimit?: number;
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
}

export interface PaginatedMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  sortBy: PaginateSort[];
  searchBy: string[];
  search: string;
  select: string[];
  filter?: Record<string, string | string[]>;
}

export interface PaginatedLinks {
  first?: string;
  previous?: string;
  current: string;
  next?: string;
  last?: string;
}

export class Paginated<T> {
  data: T[];

  meta: PaginatedMeta;

  links: PaginatedLinks;
}

function builderOf<T extends ObjectLiteral>(source: Repository<T> | SelectQueryBuilder<T>): SelectQueryBuilder<T> {
  return source instanceof Repository ? source.createQueryBuilder(PAGINATE_DEFAULT_ALIAS) : source;
}

function reference<T extends ObjectLiteral>(builder: SelectQueryBuilder<T>, column: string): string {
  return column.includes('.') ? column : `${builder.alias}.${column}`;
}

function resolveSort<T>(query: PaginateQuery, config: PaginateConfig<T>): PaginateSort[] {
  const allowed = (query.sortBy ?? []).filter(([column]) => config.sortableColumns.includes(column));

  if (allowed.length) return allowed;
  if (config.defaultSortBy?.length) return config.defaultSortBy;

  return [[config.sortableColumns[0], 'DESC' as PaginateSortDirection]];
}

function applySearch<T extends ObjectLiteral>(builder: SelectQueryBuilder<T>, query: PaginateQuery, columns: string[]): void {
  if (!query.search || !columns.length) return;

  builder.andWhere(
    new Brackets((where) => {
      columns.forEach((column, index) =>
        where.orWhere(`CAST(${reference(builder, column)} AS CHAR) LIKE :paginateSearch${index}`, {
          [`paginateSearch${index}`]: `%${query.search}%`,
        }),
      );
    }),
  );
}

function applyFilters<T extends ObjectLiteral>(
  builder: SelectQueryBuilder<T>,
  query: PaginateQuery,
  columns: Record<string, FilterOperator[]>,
): void {
  let index = 0;

  for (const [column, raw] of Object.entries(query.filter ?? {})) {
    const operators = columns[column];

    if (!operators) continue;

    for (const entry of Array.isArray(raw) ? raw : [raw]) {
      const separator = entry.indexOf(PAGINATE_FILTER_SEPARATOR);
      const operator = (separator > 0 ? entry.slice(0, separator) : FilterOperator.EQ) as FilterOperator;
      const value = separator > 0 ? entry.slice(separator + 1) : entry;

      if (!operators.includes(operator)) continue;

      const field = reference(builder, column);

      if (operator === FilterOperator.BTW) {
        const [from, to] = value.split(PAGINATE_BETWEEN_SEPARATOR);

        if (from === undefined || to === undefined) continue;

        const low = `paginateFilter${index++}`;
        const high = `paginateFilter${index++}`;

        builder.andWhere(`${field} BETWEEN :${low} AND :${high}`, { [low]: from, [high]: to });

        continue;
      }

      const comparison = PAGINATE_OPERATORS[operator];

      if (!comparison) continue;

      const parameter = `paginateFilter${index++}`;

      builder.andWhere(`${field} ${comparison} :${parameter}`, { [parameter]: value });
    }
  }
}

function pageLink(path: string, query: PaginateQuery, limit: number, page: number): string {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });

  if (query.search) params.set('search', query.search);

  return `${path}?${params.toString()}`;
}

export async function paginate<T extends ObjectLiteral>(
  query: PaginateQuery,
  source: Repository<T> | SelectQueryBuilder<T>,
  config: PaginateConfig<T>,
): Promise<Paginated<T>> {
  const builder = builderOf(source);
  const maxLimit = config.maxLimit ?? PAGINATE_MAX_LIMIT;
  const itemsPerPage = Math.max(1, Math.min(query.limit ?? config.defaultLimit ?? PAGINATE_DEFAULT_LIMIT, maxLimit));
  const currentPage = Math.max(1, query.page ?? 1);
  const sortBy = resolveSort(query, config);
  const searchBy = config.searchableColumns ?? [];

  if (config.where) builder.andWhere(config.where);

  applySearch(builder, query, searchBy);
  applyFilters(builder, query, config.filterableColumns ?? {});

  sortBy.forEach(([column, direction], index) =>
    index === 0
      ? builder.orderBy(reference(builder, column), direction)
      : builder.addOrderBy(reference(builder, column), direction),
  );

  const [data, totalItems] = await builder
    .skip((currentPage - 1) * itemsPerPage)
    .take(itemsPerPage)
    .getManyAndCount();

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    data,
    meta: {
      itemsPerPage,
      totalItems,
      currentPage,
      totalPages,
      sortBy,
      searchBy,
      search: query.search ?? '',
      select: [],
      ...(query.filter ? { filter: query.filter } : {}),
    },
    links: {
      ...(currentPage > 1 ? { first: pageLink(query.path, query, itemsPerPage, 1) } : {}),
      ...(currentPage > 1 ? { previous: pageLink(query.path, query, itemsPerPage, currentPage - 1) } : {}),
      current: pageLink(query.path, query, itemsPerPage, currentPage),
      ...(currentPage < totalPages ? { next: pageLink(query.path, query, itemsPerPage, currentPage + 1) } : {}),
      ...(currentPage < totalPages ? { last: pageLink(query.path, query, itemsPerPage, totalPages) } : {}),
    },
  };
}
