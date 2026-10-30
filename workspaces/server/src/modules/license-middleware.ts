import { NextFunction, Request, Response } from 'express';
import { currentHost } from 'unicore-api/licensing';

export const licenseMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  const id = request.path.toLowerCase().match(/^\/mod\/([a-z][a-z0-9_]{2,31})(?:\/|$)/)?.[1];
  const host = currentHost();
  if (!id || !host?.commercial('module', id)) return next();
  try {
    await host.requireLive('module', id);
    next();
  } catch {
    response.setHeader('Cache-Control', 'no-store');
    response.status(403).json({ message: 'extension_license_required' });
  }
};
