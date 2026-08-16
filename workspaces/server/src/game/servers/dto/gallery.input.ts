import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDefined, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { NAME_MAX_LENGTH, SERVER_GALLERY_MAX_IMAGES } from '@common';

export class GalleryImageInput {
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  title?: string;
}

export class GallerySortItem {
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

export class GallerySortInput {
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(SERVER_GALLERY_MAX_IMAGES)
  @ValidateNested({ each: true })
  @Type(() => GallerySortItem)
  items: GallerySortItem[];
}
