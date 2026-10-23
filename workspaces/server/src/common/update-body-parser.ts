import { json, NextFunction, Request, Response } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';

export function installUpdateBodyParser(app: NestExpressApplication): void {
  const parser = json({ limit: '1200kb' });
  app.use('/admin/updates', (request: Request, response: Response, next: NextFunction) => parser(request, response, next));
}
