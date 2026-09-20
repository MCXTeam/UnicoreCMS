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
    key: 'perm.panel.roles.update.hint',
    before:
      'Правка ролей. В разрешениях роли доступна только категория «Возможности игрока», остальное открывает право «Настраивать администраторские права ролей».',
    after:
      'Правка ролей. В разрешениях роли доступна только категория «Возможности игрока», остальное открывает право «Настраивать администраторские права ролей» — и только в пределах ваших собственных прав.',
  },
  {
    locale: 'en',
    key: 'perm.panel.roles.update.hint',
    before:
      'Editing roles. Inside a role only the «Player abilities» category is available; the rest is opened by «Configure administrative role permissions».',
    after:
      'Editing roles. Inside a role only the «Player abilities» category is available; the rest is opened by «Configure administrative role permissions», and only within the permissions you hold yourself.',
  },
];

export class RoleGrantScopeHint1756950000000 implements MigrationInterface {
  name = 'RoleGrantScopeHint1756950000000';

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
