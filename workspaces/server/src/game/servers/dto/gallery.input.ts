import { IsOptional, IsString, MaxLength } from 'class-validator';
import { NAME_MAX_LENGTH } from '@common';

export class GalleryImageInput {
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  title?: string;
}
