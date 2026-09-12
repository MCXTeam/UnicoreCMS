import { MigrationInterface, QueryRunner } from 'typeorm';

const BELL = { id: 'notifications', type: 'notifications', when: 'auth', hideOn: [], grow: false, links: [] };

interface StoredRow {
  id: string;
  blocks?: Record<string, unknown>[];
}

const alreadyPlaced = (rows: StoredRow[]): boolean =>
  rows.some((row) => (row.blocks || []).some((block) => block?.type === BELL.type));

const place = (rows: StoredRow[]): boolean => {
  for (const row of rows) {
    const blocks = row.blocks;

    if (!Array.isArray(blocks)) continue;

    const anchor = blocks.findIndex((block) => block?.type === 'login');

    if (anchor === -1) continue;

    blocks.splice(anchor, 0, { ...BELL });

    return true;
  }

  const last = rows.filter((row) => Array.isArray(row.blocks)).pop();

  if (!last) return false;

  last.blocks.push({ ...BELL });

  return true;
};

export class HeaderNotifications1756930000000 implements MigrationInterface {
  name = 'HeaderNotifications1756930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('unicore_layouts'))) return;

    const [layout] = await queryRunner.query("SELECT `mode`, `data` FROM `unicore_layouts` WHERE `id` = 'header'");

    if (!layout?.data || layout.mode !== 'builder') return;

    let rows: StoredRow[];

    try {
      rows = JSON.parse(layout.data);
    } catch {
      return;
    }

    if (!Array.isArray(rows) || alreadyPlaced(rows) || !place(rows)) return;

    await queryRunner.query("UPDATE `unicore_layouts` SET `data` = ? WHERE `id` = 'header'", [JSON.stringify(rows)]);
  }

  public async down(): Promise<void> {
    return;
  }
}
