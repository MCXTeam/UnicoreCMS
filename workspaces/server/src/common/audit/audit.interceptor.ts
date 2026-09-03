import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AUDIT_KEY } from '../constants';
import { AuditRouteOptions } from './audit.decorator';
import { AuditService, AuditTarget } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector, private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<AuditRouteOptions>(AUDIT_KEY, [context.getHandler(), context.getClass()]);

    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest();
    const { actor, ip, client } = this.audit.context(request);

    return next.handle().pipe(
      tap((result) =>
        this.audit.record({
          action: options.action,
          actor,
          ip,
          client,
          target: this.target(options, request, result),
          meta: this.meta(options, request),
        }),
      ),
      catchError((error) => {
        this.audit.record({
          action: options.action,
          status: 'failure',
          actor,
          ip,
          client,
          target: this.target(options, request),
          meta: { ...this.meta(options, request), error: error?.status ?? error?.name },
          immediate: true,
        });

        return throwError(() => error);
      }),
    );
  }

  private target(options: AuditRouteOptions, request: Record<string, any>, result?: unknown): AuditTarget | null {
    if (!options.target) return null;

    const id = options.param ? request.params?.[options.param] : options.bodyParam ? request.body?.[options.bodyParam] : null;

    return { type: options.target, id: id ?? this.createdId(result) };
  }

  private createdId(result: unknown): string | null {
    const created = result as Record<string, unknown> | null;

    if (!created || typeof created !== 'object') return null;

    const id = created.id ?? created.uuid ?? created.secret ?? created.code;

    return id === undefined || id === null ? null : String(id);
  }

  private meta(options: AuditRouteOptions, request: Record<string, any>): Record<string, unknown> | null {
    if (!options.meta?.length) return null;

    const meta: Record<string, unknown> = {};

    for (const field of options.meta) meta[field] = request.body?.[field];

    return meta;
  }
}
