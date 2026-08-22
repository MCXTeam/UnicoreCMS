import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ApiToken } from 'src/admin/api/entities/api-token.entity';
import { API_SERVER_FIELDS } from '@common';

@Injectable()
export class ApiServerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest();
    const token = request?.apiToken as ApiToken | undefined;

    if (!token?.servers?.length) return true;

    const allowed = new Set(token.servers.map((server) => String(server)));

    for (const field of API_SERVER_FIELDS) {
      for (const source of [request.params, request.query, request.body]) {
        const value = source?.[field];

        if (value === undefined || value === null || value === '') continue;

        for (const server of Array.isArray(value) ? value : [value])
          if (!allowed.has(String(server))) throw new ForbiddenException('Ключ выдан для другого сервера');
      }
    }

    return true;
  }
}
