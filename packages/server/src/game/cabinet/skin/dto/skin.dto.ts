import { Skin } from '../entities/skin.entity';
import { Exclude } from 'class-transformer';
import { SkinMeta } from './skin-meta';
import { StorageManager, getDeigest } from '@common';

export class SkinDto implements Skin {
  get url(): string {
    return StorageManager.url(this.file);
  }

  get digest(): string {
    return getDeigest(this.file);
  }

  get metadata(): SkinMeta {
    if (!this.slim) return null;

    return {
      model: 'slim',
    };
  }

  @Exclude()
  file: string;

  @Exclude()
  slim: boolean;

  constructor(partial: Partial<Skin>) {
    Object.assign(this, partial);
  }

  removeFile(): void {}
}
