import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, from, switchMap } from 'rxjs';
import { LOCALE_HEADER, RAW_CONTENT_HEADER } from 'unicore-common';
import { ContentTranslationsService } from './content-translations.service';
import { LocalesService } from './locales.service';
import { translatableOf } from './translatable.decorator';

const MAX_DEPTH = 6;

@Injectable()
export class ContentLocaleInterceptor implements NestInterceptor {
  constructor(private contentTranslations: ContentTranslationsService, private locales: LocalesService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest();
    const locale = String(request.headers?.[LOCALE_HEADER] || '');

    if (!locale || request.headers?.[RAW_CONTENT_HEADER]) return next.handle();

    return next.handle().pipe(switchMap((payload) => from(this.translate(payload, locale))));
  }

  private async translate(payload: any, locale: string): Promise<any> {
    if (!payload || locale === (await this.locales.defaultCode())) return payload;

    const targets = new Map<string, Map<string, any[]>>();

    this.collect(payload, targets, new WeakSet(), 0);

    await this.contentTranslations.overlay(locale, targets);

    return payload;
  }

  private collect(node: any, targets: Map<string, Map<string, any[]>>, seen: WeakSet<object>, depth: number): void {
    if (!node || typeof node !== 'object' || depth > MAX_DEPTH || seen.has(node)) return;

    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) this.collect(item, targets, seen, depth + 1);

      return;
    }

    const meta = translatableOf(node.constructor);

    if (meta) {
      const id = (node as any).id;

      if (id !== null && id !== undefined) {
        const byId = targets.get(meta.entity) || new Map<string, any[]>();
        const key = String(id);

        byId.set(key, [...(byId.get(key) || []), node]);
        targets.set(meta.entity, byId);
      }
    }

    for (const value of Object.values(node)) this.collect(value, targets, seen, depth + 1);
  }
}
