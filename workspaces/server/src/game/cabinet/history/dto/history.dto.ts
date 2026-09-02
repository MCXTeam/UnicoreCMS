import { Paginated } from '@common';
import { instanceToPlain, Transform, Type } from 'class-transformer';
import { UserProtectedDto } from 'src/admin/users/dto/user-protected.dto';
import { ProductProtectedDto } from 'src/game/store/dto/paginated-store.dto';

export class HistoryDto {
  @Type(() => ProductProtectedDto)
  product?: ProductProtectedDto;

  @Transform(({ value }) => value && instanceToPlain(new UserProtectedDto(value)))
  target?: UserProtectedDto;

  constructor(partial: Partial<Paginated<History>>) {
    Object.assign(this, partial);
  }
}

export class PaginatedHistoryDto extends Paginated<Partial<HistoryDto>> {
  @Transform(({ value }) => value.map((v) => instanceToPlain(new HistoryDto(v))))
  data: HistoryDto[];

  constructor(partial: Partial<Paginated<any>>) {
    super();
    Object.assign(this, partial);
  }
}
