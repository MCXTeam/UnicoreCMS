import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDefined, IsInt, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { BULK_ITEMS_MAX, SERVER_ID_MAX_LENGTH } from '../constants';

export class NumberSortItem {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority: number;
}

export class StringSortItem {
  @IsDefined()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  id: string;

  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority: number;
}

export class NumberSortInput {
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @ValidateNested({ each: true })
  @Type(() => NumberSortItem)
  items: NumberSortItem[];
}

export class StringSortInput {
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @ValidateNested({ each: true })
  @Type(() => StringSortItem)
  items: StringSortItem[];
}
