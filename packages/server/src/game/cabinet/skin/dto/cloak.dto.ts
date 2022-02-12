import { Skin } from '../entities/skin.entity';
import { Exclude } from 'class-transformer';
import { Cloak } from '../entities/cloak.entity';
import { StorageManager, getDeigest } from '@common';

export class CloakDto implements Cloak {
  get url(): string {
    return StorageManager.url(this.file);
  }

  get digest(): string {
    return getDeigest(this.file);
  }

  @Exclude()
  file: string;

  constructor(partial: Partial<Skin>) {
    Object.assign(this, partial);
  }

  removeFile(): void {}
}
