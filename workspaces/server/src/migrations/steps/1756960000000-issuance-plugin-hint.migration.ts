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
    key: 'admin.issuance_hint',
    before: 'RCON — CMS сама подключается к серверу и выполняет команды по шаблонам. Плагин — выдача через склад UnicoreConnect.',
    after:
      'RCON — CMS сама подключается к серверу и выполняет команды по шаблонам. Плагин — товары уходят на склад UnicoreConnect, а команды плагин забирает из очереди и выполняет сам; порт RCON открывать не нужно.',
  },
  {
    locale: 'en',
    key: 'admin.issuance_hint',
    before: 'RCON — the CMS connects to the server itself and runs commands from templates. Plugin — items go through the UnicoreConnect storage.',
    after:
      'RCON — the CMS connects to the server itself and runs commands from templates. Plugin — items go through the UnicoreConnect storage, and the plugin pulls queued commands and runs them itself; no RCON port needed.',
  },
];

export class IssuancePluginHint1756960000000 implements MigrationInterface {
  name = 'IssuancePluginHint1756960000000';

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
