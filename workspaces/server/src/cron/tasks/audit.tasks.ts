import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { AuditClass, AuditClassName, auditClasses } from 'unicore-common';
import { AUDIT_CLEANUP_BATCH, AUDIT_RETENTION_DEFAULTS, AuditLog, KEEP_FOREVER, SafeCron } from '@common';
import { AUDIT_RETENTION_FIELDS } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { LessThan, Repository } from 'typeorm';

const MODULE_RETENTION_CLASS: AuditClass = 'content';

export class AuditTasks {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private configService: ConfigService,
  ) {}

  private days(config: Record<string, unknown>, value: AuditClassName): number {
    const known = (AUDIT_RETENTION_FIELDS[value as AuditClass] ? value : MODULE_RETENTION_CLASS) as AuditClass;
    const raw = Number(config[AUDIT_RETENTION_FIELDS[known]]);

    return Number.isFinite(raw) && raw >= KEEP_FOREVER ? raw : AUDIT_RETENTION_DEFAULTS[known];
  }

  @SafeCron(CronExpression.EVERY_HOUR, 'audit-cleanup')
  async clean() {
    const config = await this.configService.load();

    for (const value of auditClasses()) {
      const days = this.days(config, value);

      if (days === KEEP_FOREVER) continue;

      const created = LessThan(moment().utc().subtract(days, 'days').toDate());

      while (true) {
        const expired = await this.auditRepository.find({
          where: { class: value, created },
          select: ['id'],
          take: AUDIT_CLEANUP_BATCH,
        });

        if (!expired.length) break;

        await this.auditRepository.delete(expired.map((entry) => entry.id));

        if (expired.length < AUDIT_CLEANUP_BATCH) break;
      }
    }
  }
}
