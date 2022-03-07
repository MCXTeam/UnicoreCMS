import { Exclude, Expose } from 'class-transformer';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { User } from '../entities/user.entity';

@Exclude()
export class UserProtectedDto {
  @Expose()
  uuid: string;

  @Expose()
  get uuid_clean(): string {
    return this.uuid.replace(/-/gi, '')
  }

  @Expose()
  username: string;

  @Expose()
  skin: Skin;

  @Expose()
  cloak: Cloak;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}