import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { request as httpRequest } from 'node:http';

@Injectable()
export class UpdatesService {
  async request(path: string, input?: Record<string, unknown>) {
    const address = process.env.UNICORE_UPDATER_URL;
    const token = process.env.UNICORE_UPDATER_TOKEN;
    const socketPath = process.env.UNICORE_UPDATER_SOCKET;
    if ((!address && !socketPath) || !token) {
      if (path === '/status') return { configured: false, installation: null, operations: [], jobs: [] };
      throw new ServiceUnavailableException('updates.not_configured');
    }
    if (socketPath) {
      const result: any = await new Promise((resolve, reject) => {
        const req = httpRequest(
          {
            socketPath,
            path,
            method: input ? 'POST' : 'GET',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          },
          (response) => {
            const chunks: Buffer[] = [];
            let size = 0;
            response.on('data', (chunk) => {
              size += chunk.length;
              if (size > 16 * 1024 * 1024) req.destroy(new Error('response_limit'));
              else chunks.push(chunk);
            });
            response.on('end', () => {
              try {
                resolve({ status: response.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) });
              } catch {
                reject(new Error('invalid_response'));
              }
            });
            response.on('error', reject);
          },
        );
        req.setTimeout(10000, () => req.destroy(new Error('timeout')));
        req.on('error', reject);
        if (input) req.write(JSON.stringify(input));
        req.end();
      }).catch(() => {
        throw new BadGatewayException('updates.runner_unavailable');
      });
      if (result.status >= 400) throw new BadRequestException(`updates.error.${result.data.code || 'operation_failed'}`);
      return result.data;
    }
    if (!address) throw new ServiceUnavailableException('updates.invalid_address');
    const url = new URL(address);
    if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname))
      throw new ServiceUnavailableException('updates.invalid_address');
    let response: Response;
    try {
      response = await fetch(new URL(path, url), {
        method: input ? 'POST' : 'GET',
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(input ? { body: JSON.stringify(input) } : {}),
      });
    } catch {
      throw new BadGatewayException('updates.runner_unavailable');
    }
    const result = await response.json();
    if (!response.ok) throw new BadRequestException(`updates.error.${result.code || 'operation_failed'}`);
    return result;
  }
}
