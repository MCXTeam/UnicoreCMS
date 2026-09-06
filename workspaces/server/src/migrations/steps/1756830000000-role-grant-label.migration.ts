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
    key: 'perm.panel.roles.grant.panel',
    before: 'Настраивать права ролей',
    after: 'Настраивать администраторские права ролей',
  },
  {
    locale: 'ru',
    key: 'perm.panel.roles.grant.panel.hint',
    before: 'Открывает редактор разрешений в роли. Выдать можно только те права, что есть у вас самих.',
    after:
      'Открывает в роли все категории разрешений, кроме «Возможности игрока». Выдать можно только те права, что есть у вас самих.',
  },
  {
    locale: 'ru',
    key: 'perm.panel.roles.update.hint',
    before: 'Выдать роли больше прав, чем есть у вас, нельзя.',
    after:
      'Правка ролей. В разрешениях роли доступна только категория «Возможности игрока», остальное открывает право «Настраивать администраторские права ролей».',
  },
  {
    locale: 'en',
    key: 'perm.panel.roles.grant.panel',
    before: 'Configure role permissions',
    after: 'Configure administrative role permissions',
  },
  {
    locale: 'en',
    key: 'perm.panel.roles.grant.panel.hint',
    before: 'Opens the permission editor inside a role. Only permissions you hold yourself can be granted.',
    after: 'Opens every permission category inside a role except «Player abilities». Only permissions you hold yourself can be granted.',
  },
  {
    locale: 'en',
    key: 'perm.panel.roles.update.hint',
    before: 'A role can never receive more permissions than you hold.',
    after:
      'Editing roles. Inside a role only the «Player abilities» category is available; the rest is opened by «Configure administrative role permissions».',
  },
];

export class RoleGrantLabel1756830000000 implements MigrationInterface {
  name = 'RoleGrantLabel1756830000000';

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
