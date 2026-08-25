import { ROLE_COLOR_MAX_LENGTH } from 'unicore-common';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const COLUMNS: Record<string, TableColumn[]> = {
  unicore_roles: [new TableColumn({ name: 'staff', type: 'boolean', isNullable: false, default: false })],
  unicore_donate_groups: [
    new TableColumn({ name: 'staff', type: 'boolean', isNullable: false, default: false }),
    new TableColumn({ name: 'color', type: 'varchar', length: String(ROLE_COLOR_MAX_LENGTH), isNullable: true }),
  ],
};

export class StaffFlag1756190000000 implements MigrationInterface {
  name = 'StaffFlag1756190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, columns] of Object.entries(COLUMNS)) {
      const table = await queryRunner.getTable(name);

      if (!table) continue;

      for (const column of columns) {
        if (table.findColumnByName(column.name)) continue;

        await queryRunner.addColumn(table, column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [name, columns] of Object.entries(COLUMNS)) {
      const table = await queryRunner.getTable(name);

      if (!table) continue;

      for (const column of columns) {
        if (!table.findColumnByName(column.name)) continue;

        await queryRunner.dropColumn(table, column.name);
      }
    }
  }
}
