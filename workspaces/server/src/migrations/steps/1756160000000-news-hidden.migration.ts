import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE = 'unicore_news';

export class NewsHidden1756160000000 implements MigrationInterface {
  name = 'NewsHidden1756160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table) return;

    if (!table.findColumnByName('hidden')) {
      await queryRunner.addColumn(table, new TableColumn({ name: 'hidden', type: 'boolean', isNullable: false, default: false }));
    }

    if (!table.findColumnByName('published_at')) {
      await queryRunner.addColumn(
        table,
        new TableColumn({ name: 'published_at', type: 'datetime', isNullable: false, default: 'CURRENT_TIMESTAMP' }),
      );

      await queryRunner.query(`UPDATE \`${TABLE}\` SET \`published_at\` = \`created\``);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table) return;

    if (table.findColumnByName('published_at')) await queryRunner.dropColumn(table, 'published_at');
    if (table.findColumnByName('hidden')) await queryRunner.dropColumn(table, 'hidden');
  }
}
