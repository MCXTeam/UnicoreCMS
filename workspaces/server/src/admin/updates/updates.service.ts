import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { request as httpRequest } from 'node:http';
import { dataRoot } from 'unicore-common/ports';
import { readFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class UpdatesService {
  private async setupState() {
    try {
      const state = JSON.parse(await readFile(join(dataRoot, '.unicore-updater-setup.json'), 'utf8'));
      return { state: state.state, error: state.error };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      return null;
    }
  }
  async request(path: string, input?: Record<string, unknown>) {
    const address = process.env.UNICORE_UPDATER_URL;
    let token = process.env.UNICORE_UPDATER_TOKEN;
    let socketPath = process.env.UNICORE_UPDATER_SOCKET;
    if ((!address && !socketPath) || !token) {
      const file = process.env.UNICORE_UPDATER_CONNECTION_FILE || join(dataRoot, '.unicore-updater.json');
      try {
        const info = await lstat(file);
        if (!info.isFile() || info.size > 16384 || (process.platform !== 'win32' && (info.mode & 0o077)))
          throw new ServiceUnavailableException('updates.invalid_connection');
        const connection = JSON.parse(await readFile(file, 'utf8'));
        if (typeof connection.token !== 'string' || connection.token.length < 32 || typeof connection.socketFile !== 'string' || !connection.socketFile.startsWith('/'))
          throw new ServiceUnavailableException('updates.invalid_connection');
        token = connection.token;
        socketPath = connection.socketFile;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new ServiceUnavailableException('updates.invalid_connection');
      }
    }
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
      return path === '/status' ? { ...result.data, setup: await this.setupState() } : result.data;
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
    return path === '/status' ? { ...result, setup: await this.setupState() } : result;
  }
}
