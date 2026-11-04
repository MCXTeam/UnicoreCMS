import { MigrationInterface, QueryRunner } from 'typeorm';
import { LEGACY_EMAIL_TEMPLATES } from '../../admin/email/templates/legacy';
import { EMAIL_TEMPLATES_V1 } from '../../admin/email/templates/v1';

export class EmailTemplateDesign1793750400000 implements MigrationInterface {
  name = 'EmailTemplateDesign1793750400000';

  async up(runner: QueryRunner): Promise<void> {
    if (!(await runner.hasTable('unicore_email_messages'))) return;

    for (const previous of LEGACY_EMAIL_TEMPLATES) {
      const next = EMAIL_TEMPLATES_V1.find((template) => template.id === previous.id);

      await runner.query(
        'UPDATE `unicore_email_messages` SET `title` = ?, `content` = ? WHERE `id` = ? AND BINARY `title` = BINARY ? AND BINARY `content` = BINARY ?',
        [next.title, next.content, previous.id, previous.title, previous.content],
      );
    }
  }

  async down(): Promise<void> {}
}
