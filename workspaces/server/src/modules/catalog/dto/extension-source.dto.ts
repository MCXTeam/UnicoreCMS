import { ExtensionKind, ExtensionSourceType } from 'unicore-common';
import { ExtensionSource } from '../entities/extension-source.entity';

export class ExtensionSourceDto {
  id: number;
  name: string;
  kind: ExtensionKind;
  type: ExtensionSourceType;
  location: string;
  hasToken: boolean;
  builtin: boolean;
  enabled: boolean;

  constructor(source: ExtensionSource) {
    this.id = source.id;
    this.name = source.name;
    this.kind = source.kind;
    this.type = source.type;
    this.location = source.location;
    this.hasToken = Boolean(source.token);
    this.builtin = source.builtin;
    this.enabled = source.enabled;
  }
}
