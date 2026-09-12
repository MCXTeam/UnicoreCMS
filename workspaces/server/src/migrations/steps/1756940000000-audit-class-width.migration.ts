import { MigrationInterface, QueryRunner } from 'typeorm';
import { AUDIT_CLASS_MAX_LENGTH } from 'src/common/constants';

export class AuditClassWidth1756940000000 implements MigrationInterface {
  name = 'AuditClassWidth1756940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('unicore_audit_logs'))) return;

    const column = (await queryRunner.getTable('unicore_audit_logs'))?.findColumnByName('class');

    if (!column || Number(column.length) >= AUDIT_CLASS_MAX_LENGTH) return;

    await queryRunner.query(
      `ALTER TABLE \`unicore_audit_logs\` MODIFY \`class\` VARCHAR(${AUDIT_CLASS_MAX_LENGTH}) NOT NULL`,
    );
  }

  public async down(): Promise<void> {
    return;
  }
}
