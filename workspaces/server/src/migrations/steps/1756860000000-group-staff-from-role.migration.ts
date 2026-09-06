import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE = 'unicore_donate_groups';

const COLUMN = 'staff';

export class GroupStaffFromRole1756860000000 implements MigrationInterface {
  name = 'GroupStaffFromRole1756860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const groups = await queryRunner.getTable(TABLE);

    if (!groups?.findColumnByName(COLUMN)) return;

    await queryRunner.query(
      `UPDATE \`unicore_roles\` SET \`staff\` = 1 WHERE \`id\` IN (
         SELECT \`web_role_id\` FROM \`${TABLE}\` WHERE \`${COLUMN}\` = 1 AND \`web_role_id\` IS NOT NULL
       )`,
    );

    await queryRunner.query(`ALTER TABLE \`${TABLE}\` DROP COLUMN \`${COLUMN}\``);
  }

  public async down(): Promise<void> {
    return;
  }
}
