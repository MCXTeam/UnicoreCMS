import { ConfigFieldSchema, LocalizedText } from 'unicore-api';

export type ModuleStatus = 'active' | 'disabled' | 'broken' | 'new';

export class ModuleDto {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  version: string;
  unicoreApi: string;
  author?: string;
  homepage?: string;
  status: ModuleStatus;
  reason?: string;
  hasServer: boolean;
  hasClient: boolean;
  hasAdmin: boolean;
  permissions: string[];
  config: ConfigFieldSchema[];

  constructor(partial: Partial<ModuleDto>) {
    Object.assign(this, partial);
  }
}
