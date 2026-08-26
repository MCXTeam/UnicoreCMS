import { LocalizedText } from 'unicore-api';

export interface InstallSteps {
  rebuild: boolean;
  restart: boolean;
  enable: boolean;
}

export class InstallResultDto {
  kind: 'module' | 'theme';
  id: string;
  name: LocalizedText;
  version: string;
  previousVersion?: string;
  steps: InstallSteps;

  constructor(partial: Partial<InstallResultDto>) {
    Object.assign(this, partial);
  }
}
