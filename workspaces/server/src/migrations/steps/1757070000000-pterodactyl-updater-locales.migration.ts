import { MigrationInterface, QueryRunner } from 'typeorm';
import ru from '../../seeds/locales/ru.json';
import en from '../../seeds/locales/en.json';

export class PterodactylUpdaterLocales1757070000000 implements MigrationInterface {
  name = 'PterodactylUpdaterLocales1757070000000';
  async up(runner: QueryRunner): Promise<void> {
    if (!(await runner.hasTable('unicore_translations')) || !(await runner.hasTable('unicore_locales'))) return;
    for (const [locale, messages] of Object.entries({ ru, en })) {
      for (const [key, value] of Object.entries(messages)) {
        if (!key.startsWith('updates.ptero.') && !key.startsWith('updates.error.pterodactyl_')) continue;
        await runner.query('INSERT IGNORE INTO `unicore_translations` (`locale_code`, `translation_key`, `value`) SELECT `code`, ?, ? FROM `unicore_locales` WHERE `code` = ?', [key, value, locale]);
      }
    }
  }
  async down(): Promise<void> {}
}
