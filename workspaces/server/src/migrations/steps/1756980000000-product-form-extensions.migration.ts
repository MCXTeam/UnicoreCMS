import { MigrationInterface, QueryRunner } from 'typeorm';

const translations = [
  ['ru', 'admin.extension_form_load_failed', 'Не удалось загрузить поля модуля «{module}». Повторите загрузку.'],
  ['ru', 'admin.extension_form_invalid', 'Проверьте поля модуля «{module}».'],
  ['ru', 'admin.extension_form_save_failed', 'Товар сохранён, но настройки модуля «{module}» не сохранены. Повторите сохранение.'],
  ['en', 'admin.extension_form_load_failed', 'Could not load fields for module “{module}”. Try loading them again.'],
  ['en', 'admin.extension_form_invalid', 'Check the fields for module “{module}”.'],
  ['en', 'admin.extension_form_save_failed', 'The product was saved, but settings for module “{module}” were not. Try saving again.'],
];

export class ProductFormExtensions1756980000000 implements MigrationInterface {
  name = 'ProductFormExtensions1756980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('unicore_translations')) || !(await queryRunner.hasTable('unicore_locales'))) return;

    for (const [locale, key, value] of translations)
      await queryRunner.query(
        'INSERT IGNORE INTO `unicore_translations` (`locale_code`, `translation_key`, `value`) SELECT `code`, ?, ? FROM `unicore_locales` WHERE `code` = ?',
        [key, value, locale],
      );
  }

  public async down(): Promise<void> {
    return;
  }
}
