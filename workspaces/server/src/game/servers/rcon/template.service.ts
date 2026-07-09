import { Injectable } from '@nestjs/common';
import { RenderContext, renderTemplate, secondsToDuration } from 'unicore-common';

export type { RenderContext };

@Injectable()
export class TemplateService {
  render(template: string, ctx: RenderContext): string {
    return renderTemplate(template, ctx);
  }

  static secondsToDuration(seconds: number): string {
    return secondsToDuration(seconds);
  }
}
