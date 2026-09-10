import { MigrationInterface, QueryRunner } from 'typeorm';

interface Rename {
  locale: string;
  key: string;
  before: string;
  after: string;
}

const RENAMES: Rename[] = [
  {
    locale: 'ru',
    key: 'admin.rebuild_hint',
    before:
      'Клиент и админка собираются заново, чтобы подхватить страницы и компоненты модулей. Сайт продолжает работать на старой сборке, пока новая не готова.',
    after:
      'Клиент и админка собираются заново, чтобы подхватить страницы и компоненты модулей. Пока сборка идёт, сайт работает на старой; после её завершения нужен перезапуск.',
  },
  {
    locale: 'en',
    key: 'admin.rebuild_hint',
    before:
      'The client and the panel are rebuilt so that module pages and components are picked up. The site keeps running on the previous build until the new one is ready.',
    after:
      'The client and the admin panel are rebuilt so module pages and components are picked up. While the build runs the site keeps serving the old one; once it finishes a restart is required.',
  },
];

export class RebuildRestartHint1756900000000 implements MigrationInterface {
  name = 'RebuildRestartHint1756900000000';

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
