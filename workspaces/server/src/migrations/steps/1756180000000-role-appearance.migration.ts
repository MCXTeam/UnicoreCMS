import { ROLE_COLOR_MAX_LENGTH, RoleBadgeEffect } from 'unicore-common';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE = 'unicore_roles';

const COLUMNS: TableColumn[] = [
  new TableColumn({ name: 'color', type: 'varchar', length: String(ROLE_COLOR_MAX_LENGTH), isNullable: true }),
  new TableColumn({ name: 'badge', type: 'boolean', isNullable: false, default: false }),
  new TableColumn({ name: 'badge_color', type: 'varchar', length: String(ROLE_COLOR_MAX_LENGTH), isNullable: true }),
  new TableColumn({ name: 'badge_background', type: 'varchar', length: String(ROLE_COLOR_MAX_LENGTH), isNullable: true }),
  new TableColumn({ name: 'badge_background_end', type: 'varchar', length: String(ROLE_COLOR_MAX_LENGTH), isNullable: true }),
  new TableColumn({ name: 'badge_image', type: 'varchar', isNullable: true }),
  new TableColumn({ name: 'badge_effect', type: 'int', isNullable: false, default: RoleBadgeEffect.None }),
];

export class RoleAppearance1756180000000 implements MigrationInterface {
  name = 'RoleAppearance1756180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table) return;

    for (const column of COLUMNS) {
      if (table.findColumnByName(column.name)) continue;

      await queryRunner.addColumn(table, column);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table) return;

    for (const column of COLUMNS) {
      if (!table.findColumnByName(column.name)) continue;

      await queryRunner.dropColumn(table, column.name);
    }
  }
}
