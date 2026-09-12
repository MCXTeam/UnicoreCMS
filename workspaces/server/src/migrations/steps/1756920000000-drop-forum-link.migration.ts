import { MigrationInterface, QueryRunner } from 'typeorm';

const CONFIG_KEY = 'public_link_forum';

const TRANSLATION_KEYS = ['cfg.public_link_forum_hint', 'cfg.public_link_forum_title', 'header.forum'];

interface StoredLayoutRow {
  id: string;
  data: string | null;
}

const stripForumLinks = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.map(stripForumLinks).some(Boolean);

  if (!value || typeof value !== 'object') return false;

  const node = value as Record<string, unknown>;
  let changed = false;

  if (Array.isArray(node.links)) {
    const kept = node.links.filter(
      (link) => !link || typeof link !== 'object' || (link as Record<string, unknown>).configLink !== CONFIG_KEY,
    );

    if (kept.length !== node.links.length) {
      node.links = kept;
      changed = true;
    }
  }

  for (const nested of Object.values(node)) if (stripForumLinks(nested)) changed = true;

  return changed;
};

export class DropForumLink1756920000000 implements MigrationInterface {
  name = 'DropForumLink1756920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('unicore_configs'))
      await queryRunner.query('DELETE FROM `unicore_configs` WHERE `key` = ?', [CONFIG_KEY]);

    if (await queryRunner.hasTable('unicore_translations'))
      await queryRunner.query(
        `DELETE FROM \`unicore_translations\` WHERE \`translation_key\` IN (${TRANSLATION_KEYS.map(() => '?').join(', ')})`,
        TRANSLATION_KEYS,
      );

    if (!(await queryRunner.hasTable('unicore_layouts'))) return;

    const rows: StoredLayoutRow[] = await queryRunner.query('SELECT `id`, `data` FROM `unicore_layouts`');

    for (const row of rows) {
      if (!row.data) continue;

      let definition: unknown;

      try {
        definition = JSON.parse(row.data);
      } catch {
        continue;
      }

      if (!stripForumLinks(definition)) continue;

      await queryRunner.query('UPDATE `unicore_layouts` SET `data` = ? WHERE `id` = ?', [
        JSON.stringify(definition),
        row.id,
      ]);
    }
  }

  public async down(): Promise<void> {
    return;
  }
}
