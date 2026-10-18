import type { QueryRunner } from 'typeorm';

export async function unchangedIndexQueries(queries: { query: string }[], runner: QueryRunner): Promise<Set<string>> {
  const unchanged = new Set<string>();
  for (const { query } of queries) {
    const create = query.match(/^\s*CREATE (UNIQUE )?INDEX [`"]?([^`"\s]+)[`"]? ON [`"]?([^`"\s]+)[`"]? \(([^)]+)\)\s*$/i);
    if (!create) continue;
    const [, unique, name, table, columns] = create;
    const names = columns.split(',').map((column) => column.trim().replace(/^[`"]|[`"]$/g, ''));
    const current = (await runner.getTable(table))?.indices.find((index) => index.name === name);
    if (!current || current.isFulltext || current.isSpatial || current.isNullFiltered || current.where || current.isUnique !== Boolean(unique) || current.columnNames.length !== names.length || current.columnNames.some((column, index) => column !== names[index])) continue;
    unchanged.add(query);
    for (const candidate of queries) {
      const drop = candidate.query.match(/^\s*DROP INDEX [`"]?([^`"\s]+)[`"]? ON [`"]?([^`"\s]+)[`"]?\s*$/i);
      if (drop?.[1] === name && drop[2] === table) unchanged.add(candidate.query);
    }
  }
  return unchanged;
}
