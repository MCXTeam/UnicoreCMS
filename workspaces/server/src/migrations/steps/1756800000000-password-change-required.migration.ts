import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE = 'unicore_users';
const COLUMN = 'password_change_required';

export class PasswordChangeRequired1756800000000 implements MigrationInterface {
  name = 'PasswordChangeRequired1756800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table || table.findColumnByName(COLUMN)) return;

    await queryRunner.addColumn(TABLE, new TableColumn({ name: COLUMN, type: 'boolean', isNullable: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table?.findColumnByName(COLUMN)) return;

    await queryRunner.dropColumn(TABLE, COLUMN);
  }
}
