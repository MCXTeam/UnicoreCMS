import { MigrationInterface, QueryRunner } from 'typeorm';

interface Rename {
  locale: string;
  key: string;
  before: string;
  after: string;
}

const RENAMES: Rename[] = [
  { locale: 'ru', key: 'cabinet.sessions_other', before: 'Другие', after: 'Завершить другие' },
  { locale: 'en', key: 'cabinet.sessions_other', before: 'Other', after: 'End other sessions' },
  { locale: 'ru', key: 'cabinet.sessions_all', before: 'Все', after: 'Завершить все' },
  { locale: 'en', key: 'cabinet.sessions_all', before: 'All', after: 'End all sessions' },
  {
    locale: 'ru',
    key: 'cabinet.topup_custom',
    before: 'Или укажите свою сумму в поле справа',
    after: 'Или укажите свою сумму',
  },
  {
    locale: 'en',
    key: 'cabinet.topup_custom',
    before: 'Or set your own amount in the field on the right',
    after: 'Or set your own amount',
  },
];

export class CabinetWording1756910000000 implements MigrationInterface {
  name = 'CabinetWording1756910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('unicore_translations');

    if (!table) return;

    for (const { locale, key, before, after } of RENAMES)
      await queryRunner.query(
        'UPDATE `unicore_translations` SET `value` = ? WHERE `locale_code` = ? AND `translation_key` = ? AND `value` = ?',
        [after, locale, key, before],
      );
  }

  public async down(): Promise<void> {
    return;
  }
}
