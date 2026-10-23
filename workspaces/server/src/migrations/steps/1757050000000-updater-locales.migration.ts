import { MigrationInterface, QueryRunner } from 'typeorm';
import ru from '../../seeds/locales/ru.json';
import en from '../../seeds/locales/en.json';

export class UpdaterLocales1757050000000 implements MigrationInterface {
  name = 'UpdaterLocales1757050000000';

  async up(runner: QueryRunner): Promise<void> {
    if (!(await runner.hasTable('unicore_translations')) || !(await runner.hasTable('unicore_locales'))) return;
    for (const [locale, messages] of Object.entries({ ru, en })) {
      for (const [key, value] of Object.entries(messages)) {
        if (!key.startsWith('updates.') && !key.startsWith('perm.panel.updates') && key !== 'perm.group.updates' && !key.startsWith('audit.action.update.')) continue;
        await runner.query('INSERT IGNORE INTO `unicore_translations` (`locale_code`, `translation_key`, `value`) SELECT `code`, ?, ? FROM `unicore_locales` WHERE `code` = ?', [key, value, locale]);
      }
    }
  }

  async down(): Promise<void> {}
}
