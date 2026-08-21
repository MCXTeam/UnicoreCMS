import { LocalizedText } from 'unicore-api';

export type ThemeStatus = 'active' | 'available' | 'broken' | 'incompatible';

export class ThemeDto {
  id: string;
  name: LocalizedText;
  version: string;
  unicoreApi: string;
  side: 'client' | 'admin';
  author?: string;
  homepage?: string;
  status: ThemeStatus;
  reason?: string;
  replaces: string[];
  removes: string[];

  constructor(partial: Partial<ThemeDto>) {
    Object.assign(this, partial);
  }
}
