import { ExtensionCatalogStatus, ExtensionKind, ExtensionSourceType } from 'unicore-common';
import { LocalizedText } from 'unicore-api';

export interface CatalogEntry {
  kind: ExtensionKind;
  id: string;
  version: string;
  name: LocalizedText;
  description?: LocalizedText;
  unicoreApi?: string;
  publishedAt?: string;
  size?: number;
  download: string;
  sourceId: number;
}

export class CatalogSourceStateDto {
  id: number;
  name: string;
  type: ExtensionSourceType;
  location: string;
  fetchedAt?: string;
  error?: string;

  constructor(partial: CatalogSourceStateDto) {
    Object.assign(this, partial);
  }
}

export class CatalogEntryDto {
  kind: ExtensionKind;
  id: string;
  version: string;
  name: LocalizedText;
  description?: LocalizedText;
  unicoreApi?: string;
  compatible: boolean;
  publishedAt?: string;
  size?: number;
  source: { id: number; name: string; type: ExtensionSourceType };
  installedVersion?: string;
  status: ExtensionCatalogStatus;

  constructor(partial: CatalogEntryDto) {
    Object.assign(this, partial);
  }
}

export class CatalogDto {
  entries: CatalogEntryDto[];
  sources: CatalogSourceStateDto[];

  constructor(partial: CatalogDto) {
    Object.assign(this, partial);
  }
}
