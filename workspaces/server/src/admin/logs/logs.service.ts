import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { AUDIT_CLASSES, AuditClass, Permission, auditActions, auditClassPermission } from 'unicore-common';
import { AUDIT_DEFAULT_LIMIT, AUDIT_MAX_LIMIT, AuditLog, FilterOperator, Paginated, PaginateQuery, filterValues, paginate } from '@common';
import { matchPermission } from '../roles/guards/permisson.guard';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async allowedClasses(request: unknown): Promise<AuditClass[]> {
    const allowed: AuditClass[] = [];

    for (const value of AUDIT_CLASSES) if (await matchPermission([auditClassPermission(value) as Permission], request)) allowed.push(value);

    return allowed;
  }

  actions() {
    return auditActions();
  }

  async find(query: PaginateQuery, request: unknown, player?: string): Promise<Paginated<AuditLog>> {
    const allowed = await this.allowedClasses(request);

    if (!allowed.length) throw new ForbiddenException();

    const requested = this.requestedClasses(query, allowed);
    const builder = this.auditRepository.createQueryBuilder('audit').where({ class: In(requested) });

    this.applyPlayer(builder, player);

    return paginate(query, builder, {
      sortableColumns: ['id', 'created', 'action', 'class', 'status', 'actorName', 'targetName'],
      searchableColumns: ['action', 'actorId', 'actorName', 'targetId', 'targetName', 'ip'],
      defaultSortBy: [['created', 'DESC']],
      defaultLimit: AUDIT_DEFAULT_LIMIT,
      maxLimit: AUDIT_MAX_LIMIT,
      filterableColumns: {
        action: [FilterOperator.EQ],
        status: [FilterOperator.EQ],
        actorId: [FilterOperator.EQ],
        targetId: [FilterOperator.EQ],
        created: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
      },
    });
  }

  private applyPlayer(builder: SelectQueryBuilder<AuditLog>, player?: string): void {
    const value = String(player ?? '').trim();

    if (!value) return;

    builder.andWhere(
      new Brackets((where) =>
        where
          .where('audit.actor_id = :player', { player: value })
          .orWhere('audit.target_id = :player', { player: value })
          .orWhere('audit.actor_name = :player', { player: value })
          .orWhere('audit.target_name = :player', { player: value }),
      ),
    );
  }

  private requestedClasses(query: PaginateQuery, allowed: AuditClass[]): AuditClass[] {
    const requested = filterValues(query, 'class') as AuditClass[];

    if (!requested.length) return allowed;

    const matched = requested.filter((value) => allowed.includes(value));

    if (!matched.length) throw new ForbiddenException();

    return matched;
  }
}
