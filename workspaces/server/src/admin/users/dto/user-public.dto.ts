import { Exclude, Expose, Type } from 'class-transformer';
import { PlaytimeDto } from 'src/game/cabinet/playtime/dto/playtime.dto';
import { Playtime } from 'src/game/cabinet/playtime/entities/playtime.entity';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { BanDto } from 'src/game/players/banlist/dto/paginated-bans.dto';
import { User } from '../entities/user.entity';

@Exclude()
export class UserPublicDto {
  @Expose()
  uuid: string;

  @Expose()
  username: string;

  @Expose()
  skin: Skin;

  @Expose()
  cloak: Cloak;

  @Expose()
  created: Date;

  @Expose()
  @Type(() => BanDto)
  ban: BanDto;

  @Expose()
  @Type(() => PlaytimeDto)
  playtimes: PlaytimeDto[]

  @Expose()
  votes: number

  @Expose()
  referals: any

  constructor(partial: Partial<User & {
    votes: number,
    playtimes: Playtime[],
    referals: any
  }>) {
    Object.assign(this, partial);
  }
}
