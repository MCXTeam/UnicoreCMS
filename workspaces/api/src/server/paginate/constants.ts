export type PaginateSortDirection = 'ASC' | 'DESC'

export const PAGINATE_SORT_DIRECTIONS: string[] = ['ASC', 'DESC']

export const PAGINATE_DEFAULT_ALIAS = 'entity'

export const PAGINATE_DEFAULT_LIMIT = 20

export const PAGINATE_MAX_LIMIT = 100

export const PAGINATE_FILTER_SEPARATOR = ':'

export const PAGINATE_BETWEEN_SEPARATOR = ','

export const PAGINATE_SORT_SEPARATOR = ':'

export const PAGINATE_SORT_PATTERN = /^sortBy\[(\d+)\]\[(\d+)\]$/

export const PAGINATE_FILTER_PATTERN = /^filter(?:\[([^\]]+)\]|\.([^.]+))$/

export const PAGINATE_OPERATORS: Record<string, string> = {
  $eq: '=',
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
}
