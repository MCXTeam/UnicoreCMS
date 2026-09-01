import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { gt, satisfies, valid } from 'semver';
import { EXTENSION_ARCHIVE_PATTERN, EXTENSION_ASSET_PATTERN, ExtensionCatalogStatus, ExtensionKind } from 'unicore-common';
import { API_VERSION, LocalizedText, MODULE_ID_PATTERN } from 'unicore-api';
import {
  EXTENSION_CATALOG_CACHE_TTL_MS,
  EXTENSION_CATALOG_MAX_BYTES,
  GITHUB_API_BASEURL,
  GITHUB_API_VERSION,
  GITHUB_RELEASES_PER_PAGE,
} from '@common';
import { InstallResultDto } from '../dto/install-result.dto';
import { InstallService } from '../install/install.service';
import { discover } from '../runtime/discovery';
import { discoverThemes } from '../runtime/themes';
import { ExtensionDownloadService } from './download.service';
import { CatalogDto, CatalogEntry, CatalogEntryDto, CatalogSourceStateDto } from './dto/catalog-entry.dto';
import { CatalogInstallInput, InstallUrlInput } from './dto/catalog-install.input';
import { ExtensionSource } from './entities/extension-source.entity';
import { ExtensionSourcesService } from './sources.service';

interface GithubAsset {
  id: number;
  name: string;
  size: number;
  url: string;
}

interface GithubRelease {
  tag_name: string;
  name?: string;
  body?: string;
  draft: boolean;
  prerelease: boolean;
  published_at?: string;
  assets: GithubAsset[];
}

interface ReleaseSummary {
  name?: LocalizedText;
  description?: LocalizedText;
  unicoreApi?: string;
}

interface RemoteCatalogItem {
  id: string;
  kind?: string;
  version: string;
  name?: LocalizedText;
  description?: LocalizedText;
  unicoreApi?: string;
  download: string;
  publishedAt?: string;
  size?: number;
}

interface CachedSource {
  at: number;
  entries: CatalogEntry[];
  error?: string;
}

const SUMMARY_BLOCK_PATTERN = /```json\s*([\s\S]*?)```/i;
const DESCRIPTION_MAX_LENGTH = 300;

@Injectable()
export class ExtensionCatalogService {
  private readonly logger = new Logger('Catalog');
  private readonly cache = new Map<number, CachedSource>();

  constructor(
    private readonly sources: ExtensionSourcesService,
    private readonly downloads: ExtensionDownloadService,
    private readonly install: InstallService,
  ) {}

  async catalog(kind: ExtensionKind, refresh = false): Promise<CatalogDto> {
    const sources = await this.sources.enabled(kind);
    const installed = this.installedVersions(kind);
    const entries: CatalogEntryDto[] = [];
    const states: CatalogSourceStateDto[] = [];

    for (const source of sources) {
      const cached = await this.fetch(source, refresh);

      states.push(
        new CatalogSourceStateDto({
          id: source.id,
          name: source.name,
          type: source.type,
          location: source.location,
          fetchedAt: new Date(cached.at).toISOString(),
          error: cached.error,
        }),
      );

      for (const entry of cached.entries) entries.push(this.describe(entry, source, installed.get(entry.id)));
    }

    entries.sort((left, right) => this.title(left.name).localeCompare(this.title(right.name)));

    return new CatalogDto({ entries, sources: states });
  }

  async installFromCatalog(input: CatalogInstallInput): Promise<InstallResultDto> {
    const source = await this.sources.one(input.sourceId);

    if (source.kind !== input.kind) throw new BadRequestException('Источник не содержит расширений этого типа');

    const cached = await this.fetch(source, false);
    const entry = cached.entries.find((item) => item.id === input.id);

    if (!entry) throw new BadRequestException(`В источнике «${source.name}» нет расширения «${input.id}»`);

    const archive = await this.downloads.archive(entry.download, { token: this.sources.token(source) });

    this.logger.log(`Скачан ${entry.kind} ${entry.id} ${entry.version} из «${source.name}» (${archive.size} байт)`);

    return this.install.install(archive.filename, { kind: entry.kind, id: entry.id });
  }

  async installFromUrl(input: InstallUrlInput): Promise<InstallResultDto> {
    const archive = await this.downloads.archive(input.url, { token: input.token, tokenHosts: [new URL(input.url).hostname] });

    this.logger.log(`Скачан архив по ссылке ${input.url} (${archive.size} байт)`);

    return this.install.install(archive.filename);
  }

  private async fetch(source: ExtensionSource, refresh: boolean): Promise<CachedSource> {
    const cached = this.cache.get(source.id);

    if (cached && !refresh && Date.now() - cached.at < EXTENSION_CATALOG_CACHE_TTL_MS) return cached;

    let result: CachedSource;

    try {
      const entries = source.type === 'github' ? await this.fromGithub(source) : await this.fromUrl(source);

      result = { at: Date.now(), entries };
    } catch (error) {
      result = { at: Date.now(), entries: cached?.entries || [], error: error instanceof Error ? error.message : String(error) };
      this.logger.warn(`Источник «${source.name}» не прочитан: ${result.error}`);
    }

    this.cache.set(source.id, result);

    return result;
  }

  private async fromGithub(source: ExtensionSource): Promise<CatalogEntry[]> {
    const url = `${GITHUB_API_BASEURL}/repos/${source.location}/releases?per_page=${GITHUB_RELEASES_PER_PAGE}`;
    const releases = await this.downloads.json<GithubRelease[]>(
      url,
      { token: this.sources.token(source), accept: 'application/vnd.github+json', headers: { 'X-GitHub-Api-Version': GITHUB_API_VERSION } },
      EXTENSION_CATALOG_MAX_BYTES,
    );

    if (!Array.isArray(releases)) throw new Error('GitHub вернул не список релизов');

    const latest = new Map<string, CatalogEntry>();

    for (const release of releases) {
      if (release.draft || release.prerelease) continue;

      const summary = this.summary(release);

      for (const asset of release.assets || []) {
        const match = EXTENSION_ASSET_PATTERN.exec(asset.name);

        if (!match) continue;

        const [, id, version] = match;

        if (!valid(version)) continue;

        const entry: CatalogEntry = {
          kind: source.kind,
          id: id.toLowerCase(),
          version,
          name: summary.name || release.name || id,
          description: summary.description || this.excerpt(release.body),
          unicoreApi: summary.unicoreApi,
          publishedAt: release.published_at,
          size: asset.size,
          download: asset.url,
          sourceId: source.id,
        };
        const known = latest.get(entry.id);

        if (!known || gt(entry.version, known.version)) latest.set(entry.id, entry);
      }
    }

    return [...latest.values()];
  }

  private async fromUrl(source: ExtensionSource): Promise<CatalogEntry[]> {
    const token = this.sources.token(source);
    const payload = await this.downloads.json<RemoteCatalogItem[] | { extensions: RemoteCatalogItem[] }>(
      source.location,
      { token, tokenHosts: [new URL(source.location).hostname] },
      EXTENSION_CATALOG_MAX_BYTES,
    );
    const items = Array.isArray(payload) ? payload : payload?.extensions;

    if (!Array.isArray(items)) throw new Error('Каталог должен быть массивом или объектом с полем extensions');

    const latest = new Map<string, CatalogEntry>();

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      if (item.kind && item.kind !== source.kind) continue;
      if (typeof item.id !== 'string' || !MODULE_ID_PATTERN.test(item.id) || !valid(String(item.version))) continue;
      if (typeof item.download !== 'string' || !EXTENSION_ARCHIVE_PATTERN.test(item.download)) continue;

      const entry: CatalogEntry = {
        kind: source.kind,
        id: item.id,
        version: String(item.version),
        name: this.localized(item.name) || item.id,
        description: this.localized(item.description),
        unicoreApi: typeof item.unicoreApi === 'string' ? item.unicoreApi : undefined,
        publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : undefined,
        size: Number.isFinite(item.size) ? Number(item.size) : undefined,
        download: new URL(item.download, source.location).href,
        sourceId: source.id,
      };
      const known = latest.get(entry.id);

      if (!known || gt(entry.version, known.version)) latest.set(entry.id, entry);
    }

    return [...latest.values()];
  }

  private summary(release: GithubRelease): ReleaseSummary {
    const match = SUMMARY_BLOCK_PATTERN.exec(release.body || '');

    if (!match) return {};

    try {
      const parsed = JSON.parse(match[1]);

      return {
        name: this.localized(parsed?.name),
        description: this.localized(parsed?.description),
        unicoreApi: typeof parsed?.unicoreApi === 'string' ? parsed.unicoreApi : undefined,
      };
    } catch {
      return {};
    }
  }

  private localized(value: unknown): LocalizedText | undefined {
    if (typeof value === 'string') return value.trim() || undefined;

    if (value && typeof value === 'object') {
      const record = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(([, text]) => typeof text === 'string' && text.trim()),
      ) as Record<string, string>;

      return Object.keys(record).length ? record : undefined;
    }

    return undefined;
  }

  private excerpt(body?: string): string | undefined {
    const text = (body || '')
      .replace(SUMMARY_BLOCK_PATTERN, '')
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#'));

    if (!text) return undefined;

    return text.length > DESCRIPTION_MAX_LENGTH ? `${text.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…` : text;
  }

  private title(name: LocalizedText): string {
    return typeof name === 'string' ? name : Object.values(name)[0] || '';
  }

  private installedVersions(kind: ExtensionKind): Map<string, string> {
    const versions = new Map<string, string>();

    if (kind === 'module') for (const module of discover().modules) versions.set(module.id, module.manifest.version);
    else for (const theme of discoverThemes().themes) versions.set(theme.id, theme.manifest.version);

    return versions;
  }

  private describe(entry: CatalogEntry, source: ExtensionSource, installedVersion?: string): CatalogEntryDto {
    return new CatalogEntryDto({
      kind: entry.kind,
      id: entry.id,
      version: entry.version,
      name: entry.name,
      description: entry.description,
      unicoreApi: entry.unicoreApi,
      compatible: entry.unicoreApi ? satisfies(API_VERSION, entry.unicoreApi) : true,
      publishedAt: entry.publishedAt,
      size: entry.size,
      source: { id: source.id, name: source.name, type: source.type },
      installedVersion,
      status: this.status(entry.version, installedVersion),
    });
  }

  private status(available: string, installed?: string): ExtensionCatalogStatus {
    if (!installed || !valid(installed)) return installed ? 'installed' : 'new';
    if (gt(available, installed)) return 'update';
    if (gt(installed, available)) return 'ahead';

    return 'installed';
  }
}
