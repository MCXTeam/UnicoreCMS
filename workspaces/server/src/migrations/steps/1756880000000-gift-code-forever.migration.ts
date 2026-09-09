import { MigrationInterface, QueryRunner } from 'typeorm';

const KEY = 'gifts_code_expire_days';

const PREVIOUS_DEFAULT = '365';

export class GiftCodeForever1756880000000 implements MigrationInterface {
  name = 'GiftCodeForever1756880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('unicore_configs');

    if (!table) return;

    await queryRunner.query('UPDATE `unicore_configs` SET `value` = ? WHERE `key` = ? AND `value` = ?', ['0', KEY, PREVIOUS_DEFAULT]);
  }

  public async down(): Promise<void> {
    return;
  }
}
