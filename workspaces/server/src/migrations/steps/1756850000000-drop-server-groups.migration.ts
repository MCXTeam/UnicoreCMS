import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE = 'unicore_server_groups';

const COLUMN = 'group_id';

export class DropServerGroups1756850000000 implements MigrationInterface {
  name = 'DropServerGroups1756850000000';

  private async count(queryRunner: QueryRunner, sql: string): Promise<number> {
    const rows: { total: number | string }[] = await queryRunner.query(sql);

    return Number(rows[0]?.total ?? 0);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const servers = await queryRunner.getTable('unicore_servers');

    if (servers?.findColumnByName(COLUMN)) {
      const linked = await this.count(queryRunner, `SELECT COUNT(*) AS total FROM \`unicore_servers\` WHERE \`${COLUMN}\` IS NOT NULL`);

      if (!linked) {
        for (const key of servers.foreignKeys.filter((item) => item.columnNames.includes(COLUMN)))
          await queryRunner.query(`ALTER TABLE \`unicore_servers\` DROP FOREIGN KEY \`${key.name}\``);

        await queryRunner.query(`ALTER TABLE \`unicore_servers\` DROP COLUMN \`${COLUMN}\``);
      }
    }

    if (!(await queryRunner.getTable(TABLE))) return;

    const groups = await this.count(queryRunner, `SELECT COUNT(*) AS total FROM \`${TABLE}\``);

    if (!groups) await queryRunner.query(`DROP TABLE \`${TABLE}\``);
  }

  public async down(): Promise<void> {
    return;
  }
}
