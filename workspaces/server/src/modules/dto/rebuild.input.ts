import { ArrayNotEmpty, IsArray, IsIn, IsOptional } from 'class-validator';
import { REBUILD_SIDES, RebuildSide } from '../rebuild.service';

export class RebuildInput {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(REBUILD_SIDES, { each: true })
  sides?: RebuildSide[];
}
