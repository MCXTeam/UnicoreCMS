import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import {
  DEFAULT_LAYOUT,
  LAYOUT_ALIGNMENTS,
  LAYOUT_BLOCK_TYPES,
  LAYOUT_PLACES,
  LAYOUT_SCREENS,
  LAYOUT_VISIBILITY,
  LayoutBlock,
  LayoutDefinition,
  LayoutLink,
  LayoutPlace,
  LayoutRow,
  LayoutState,
  LayoutText,
} from 'unicore-common';
import {
  AuditService,
  CacheKey,
  LAYOUT_BLOCKS_MAX,
  LAYOUT_HTML_MAX_LENGTH,
  LAYOUT_LINKS_MAX,
  LAYOUT_ROWS_MAX,
  sanitizeHtml,
} from '@common';
import { EventsService } from 'src/events/events.service';
import { LayoutInput } from './dto/layout.input';
import { Layout } from './entities/layout.entity';

const TEXT_MAX_LENGTH = 4000;

const clean = (value: unknown, max = 255): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const oneOf = <T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] =>
  allowed.includes(value as T[number]) ? (value as T[number]) : fallback;

function text(value: unknown): LayoutText {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const result: LayoutText = {};

  for (const [locale, content] of Object.entries(value as Record<string, unknown>)) {
    const key = clean(locale, 16);

    if (key) result[key] = clean(content, TEXT_MAX_LENGTH);
  }

  return result;
}

@Injectable()
export class LayoutService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Layout) private layoutsRepository: Repository<Layout>,
    private auditService: AuditService,
    private eventsService: EventsService,
  ) {}

  private link(input: unknown): LayoutLink {
    const source = (input || {}) as Record<string, unknown>;

    return {
      id: clean(source.id, 64) || Math.random().toString(36).slice(2, 10),
      label: text(source.label),
      labelKey: clean(source.labelKey, 128) || undefined,
      to: clean(source.to, 512) || undefined,
      href: clean(source.href, 512) || undefined,
      configLink: clean(source.configLink, 128) || undefined,
      icon: clean(source.icon, 64) || undefined,
      when: oneOf(source.when, LAYOUT_VISIBILITY, 'always'),
    };
  }

  private block(input: unknown): LayoutBlock {
    const source = (input || {}) as Record<string, unknown>;
    const screens = Array.isArray(source.hideOn) ? source.hideOn : [];

    return {
      id: clean(source.id, 64) || Math.random().toString(36).slice(2, 10),
      type: oneOf(source.type, LAYOUT_BLOCK_TYPES, 'text'),
      when: oneOf(source.when, LAYOUT_VISIBILITY, 'always'),
      hideOn: LAYOUT_SCREENS.filter((screen) => screens.includes(screen)),
      grow: source.grow === true,
      title: text(source.title),
      text: text(source.text),
      html: sanitizeHtml(clean(source.html, TEXT_MAX_LENGTH * 4)),
      image: clean(source.image, 512),
      href: clean(source.href, 512),
      size: Number.isFinite(Number(source.size)) ? Math.min(Math.max(Number(source.size), 8), 400) : undefined,
      columns: Number.isFinite(Number(source.columns)) ? Math.min(Math.max(Number(source.columns), 1), 4) : undefined,
      links: (Array.isArray(source.links) ? source.links : []).slice(0, LAYOUT_LINKS_MAX).map((item) => this.link(item)),
    };
  }

  private row(input: unknown): LayoutRow {
    const source = (input || {}) as Record<string, unknown>;

    return {
      id: clean(source.id, 64) || Math.random().toString(36).slice(2, 10),
      align: oneOf(source.align, LAYOUT_ALIGNMENTS, 'between'),
      blocks: (Array.isArray(source.blocks) ? source.blocks : []).slice(0, LAYOUT_BLOCKS_MAX).map((item) => this.block(item)),
    };
  }

  private normalize(input: LayoutInput): LayoutDefinition {
    const rows = (Array.isArray(input.rows) ? input.rows : []).slice(0, LAYOUT_ROWS_MAX).map((row) => this.row(row));

    if (input.mode === 'builder' && !rows.length) throw new BadRequestException('Нужен хотя бы один ряд');

    return { mode: input.mode, rows, html: sanitizeHtml(clean(input.html, LAYOUT_HTML_MAX_LENGTH)) };
  }

  private parse(row: Layout | null, fallback: LayoutDefinition): LayoutDefinition {
    if (!row) return fallback;

    try {
      const rows = row.data ? (JSON.parse(row.data) as LayoutRow[]) : fallback.rows;

      return { mode: row.mode || 'builder', rows: Array.isArray(rows) ? rows : fallback.rows, html: row.html || '' };
    } catch {
      return fallback;
    }
  }

  async state(): Promise<LayoutState> {
    const cached = await this.cacheManager.get<LayoutState>(CacheKey.Layout);

    if (cached) return cached;

    const stored = await this.layoutsRepository.find();
    const state = Object.fromEntries(
      LAYOUT_PLACES.map((place) => [place, this.parse(stored.find((row) => row.id === place) || null, DEFAULT_LAYOUT[place])]),
    ) as LayoutState;

    await this.cacheManager.set(CacheKey.Layout, state);

    return state;
  }

  async update(place: LayoutPlace, input: LayoutInput, request?: unknown): Promise<LayoutDefinition> {
    const definition = this.normalize(input);
    const row = new Layout();

    row.id = place;
    row.mode = definition.mode;
    row.data = JSON.stringify(definition.rows);
    row.html = definition.html;

    await this.layoutsRepository.save(row);
    await this.cacheManager.del(CacheKey.Layout);

    const { actor, ip, client } = this.auditService.context(request);

    this.auditService.record({
      action: 'layout.update',
      actor,
      ip,
      client,
      target: { type: 'layout', id: place },
      meta: { mode: definition.mode, rows: definition.rows.length },
    });

    this.eventsService.emitPublic('layout/updated', { place });

    return definition;
  }
}
