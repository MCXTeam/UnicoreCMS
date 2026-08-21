import { IsBoolean } from 'class-validator';

export class ModuleStateInput {
  @IsBoolean()
  enabled: boolean;
}
