import { Skin } from '../entities/skin.entity';
import { Exclude, Expose } from 'class-transformer';
import { SkinMeta } from './skin-meta';
import { StorageManager, getDeigest } from '@common';

export class SkinDto {
  @Exclude()
  file: string;

  @Exclude()
  slim: boolean;

  @Expose()
  get url(): string {
    return StorageManager.url(this.file);
  }

  @Expose()
  get digest(): string {
    return getDeigest(this.file);
  }

  @Expose()
  get metadata(): SkinMeta {
    if (!this.slim) return null;

    return {
      model: 'slim',
    };
  }

  constructor(partial: Partial<Skin>) {
    Object.assign(this, partial);
  }
}
