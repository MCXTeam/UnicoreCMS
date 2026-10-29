import { MigrationInterface, QueryRunner } from 'typeorm';
import ru from '../../seeds/locales/ru.json';
import en from '../../seeds/locales/en.json';

const KEYS = new Set([
  'admin.theme_apply',
  'admin.theme_reset',
  'admin.extensions_installed',
  'admin.extensions_catalog',
  'admin.show_all_items',
  'admin.import_export',
  'admin.selected_items',
  'admin.more_actions',
  'admin.table_scroll_hint',
  'admin.sorting',
  'store.available_catalogs',
  'store.catalogs_empty',
  'store.open_catalog',
  'store.empty_catalogs',
  'store.catalog_empty_hint',
  'store.catalog_load_error',
  'cabinet.topup_unavailable',
  'cabinet.topup_load_error',
  'cabinet.topup_retry_hint',
  'cabinet.topup_alternatives',
]);

export class InterfaceCatalogLocales1757090000000 implements MigrationInterface {
  name = 'InterfaceCatalogLocales1757090000000';

  async up(runner: QueryRunner): Promise<void> {
    if (!(await runner.hasTable('unicore_translations')) || !(await runner.hasTable('unicore_locales'))) return;
    for (const [locale, messages] of Object.entries({ ru, en }))
      for (const [key, value] of Object.entries(messages)) {
        if (!KEYS.has(key)) continue;
        await runner.query('INSERT IGNORE INTO `unicore_translations` (`locale_code`, `translation_key`, `value`) SELECT `code`, ?, ? FROM `unicore_locales` WHERE `code` = ?', [key, value, locale]);
      }
  }

  async down(): Promise<void> {}
}
