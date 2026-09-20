import { Paginated } from '@common';
import { Exclude, Expose, Transform, instanceToPlain } from 'class-transformer';
import { Type } from 'class-transformer';
import { UserProtectedDto } from 'src/admin/users/dto/user-protected.dto';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';

@Exclude()
export class AdminReferalDto {
  @Expose()
  userUuid: string;

  @Expose()
  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  user: UserProtectedDto;

  @Expose()
  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  inviter: UserProtectedDto;

  @Expose()
  rewarded: boolean;

  constructor(partial: Partial<Referal>) {
    Object.assign(this, partial);
  }
}

export class PaginatedReferalsDto extends Paginated<AdminReferalDto> {
  @Type(() => AdminReferalDto)
  data: AdminReferalDto[];

  constructor(partial: Paginated<Referal>) {
    super();
    Object.assign(this, { ...partial, data: partial.data.map((referal) => new AdminReferalDto(referal)) });
  }
}
