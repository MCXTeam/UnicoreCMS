import { IsOptional, IsString, Matches } from 'class-validator';
import { THEME_ID_PATTERN } from 'unicore-api';

export class ThemeActiveInput {
  @IsOptional()
  @IsString()
  @Matches(THEME_ID_PATTERN, { message: 'Некорректный идентификатор темы' })
  id?: string | null;
}
