import { MigrationInterface, QueryRunner } from 'typeorm';

const OLD_TABLE = 'unicore_group_kit_images';

const TABLE = 'unicore_group_kit_servers';

export class KitServerDescription1756890000000 implements MigrationInterface {
  name = 'KitServerDescription1756890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.getTable(TABLE))) {
      if (!(await queryRunner.getTable(OLD_TABLE))) return;

      await queryRunner.query(`RENAME TABLE \`${OLD_TABLE}\` TO \`${TABLE}\``);
    }

    const table = await queryRunner.getTable(TABLE);

    if (!table) return;

    if (!table.findColumnByName('description')) await queryRunner.query(`ALTER TABLE \`${TABLE}\` ADD \`description\` text NULL`);

    const image = table.findColumnByName('image');

    if (image && !image.isNullable) await queryRunner.query(`ALTER TABLE \`${TABLE}\` MODIFY \`image\` varchar(255) NULL`);
  }

  public async down(): Promise<void> {
    return;
  }
}
