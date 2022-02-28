import { Skin } from '../entities/skin.entity';
import { Exclude, Expose } from 'class-transformer';
import { StorageManager, getDeigest } from '@common';

export class CloakDto {
  @Expose()
  get url(): string {
    return StorageManager.url(this.file);
  }

  @Expose()
  get digest(): string {
    return getDeigest(this.file);
  }

  @Exclude()
  file: string;

  constructor(partial: Partial<Skin>) {
    Object.assign(this, partial);
  }
}
