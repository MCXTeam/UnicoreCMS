import { MigrationInterface, QueryRunner } from 'typeorm';
import ru from '../../seeds/locales/ru.json';
import en from '../../seeds/locales/en.json';

export class ExtensionLicenseLocales1757100000000 implements MigrationInterface {
  name = 'ExtensionLicenseLocales1757100000000';

  async up(runner: QueryRunner): Promise<void> {
    if (!(await runner.hasTable('unicore_translations')) || !(await runner.hasTable('unicore_locales'))) return;
    for (const [locale, messages] of Object.entries({ ru, en }))
      for (const [key, value] of Object.entries(messages)) {
        if (!key.startsWith('licensing.') && key !== 'extension_license_required') continue;
        await runner.query(
          'INSERT IGNORE INTO `unicore_translations` (`locale_code`, `translation_key`, `value`) SELECT `code`, ?, ? FROM `unicore_locales` WHERE `code` = ?',
          [key, value, locale],
        );
      }
  }

  async down(): Promise<void> {}
}
