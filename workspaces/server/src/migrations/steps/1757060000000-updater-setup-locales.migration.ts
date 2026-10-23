import { MigrationInterface, QueryRunner } from 'typeorm';
import ru from '../../seeds/locales/ru.json';
import en from '../../seeds/locales/en.json';

export class UpdaterSetupLocales1757060000000 implements MigrationInterface {
  name = 'UpdaterSetupLocales1757060000000';
  async up(runner: QueryRunner): Promise<void> {
    if (!(await runner.hasTable('unicore_translations')) || !(await runner.hasTable('unicore_locales'))) return;
    for (const [locale, messages] of Object.entries({ ru, en })) {
      for (const [key, value] of Object.entries(messages)) {
        if (!key.startsWith('updates.setup.') && !key.startsWith('updates.error.setup_') && !['updates.error.docker_unavailable', 'updates.error.builder_unavailable', 'updates.error.pm2_apps_required', 'updates.error.EACCES', 'updates.error.linux_executor_required', 'perm.panel.updates.setup', 'audit.action.update.setup'].includes(key)) continue;
        await runner.query('INSERT IGNORE INTO `unicore_translations` (`locale_code`, `translation_key`, `value`) SELECT `code`, ?, ? FROM `unicore_locales` WHERE `code` = ?', [key, value, locale]);
      }
    }
  }
  async down(): Promise<void> {}
}
