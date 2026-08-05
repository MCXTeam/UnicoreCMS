import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rcon } from 'rcon-client';
import { RCON } from './entities/rcon.entity';
import { RCON_TEST_TIMEOUT_MS } from 'src/common/constants';

export interface RconTestResult {
  ok: boolean;
  latency?: number;
  error?: string;
}

@Injectable()
export class RconService implements OnModuleDestroy {
  private readonly logger = new Logger('RconService');
  private readonly connections = new Map<string, Rcon>();
  private readonly connecting = new Map<string, Promise<Rcon>>();

  constructor(@InjectRepository(RCON) private readonly rconRepository: Repository<RCON>) {}

  private getCreds(serverId: string): Promise<RCON | null> {
    return this.rconRepository.findOneBy({ serverId });
  }

  private connect(creds: RCON): Promise<Rcon> {
    const key = creds.serverId;

    const existing = this.connections.get(key);
    if (existing) return Promise.resolve(existing);

    const pending = this.connecting.get(key);
    if (pending) return pending;

    const promise = Rcon.connect({
      host: creds.host,
      port: creds.port,
      password: creds.password,
      timeout: 5000,
    })
      .then((client) => {
        const drop = () => {
          if (this.connections.get(key) === client) this.connections.delete(key);
        };
        client.on('end', drop);
        client.on('error', (error) => {
          this.logger.warn(`RCON connection error for server ${key}: ${error?.message || error}`);
          drop();
        });
        this.connections.set(key, client);
        this.connecting.delete(key);
        return client;
      })
      .catch((error) => {
        this.connecting.delete(key);
        throw error;
      });

    this.connecting.set(key, promise);
    return promise;
  }

  async sendCommand(serverId: string, command: string): Promise<string> {
    const creds = await this.getCreds(serverId);
    if (!creds) throw new Error(`RCON credentials are not configured for server "${serverId}"`);

    try {
      const client = await this.connect(creds);
      return await client.send(command);
    } catch (error) {
      this.invalidate(serverId);
      throw error;
    }
  }

  async sendCommands(serverId: string, commands: string[]): Promise<string[]> {
    const responses: string[] = [];
    for (const command of commands) {
      responses.push(await this.sendCommand(serverId, command));
    }
    return responses;
  }

  async test(serverId: string): Promise<RconTestResult> {
    const creds = await this.getCreds(serverId);
    if (!creds) return { ok: false, error: `RCON credentials are not configured for server "${serverId}"` };

    const started = Date.now();
    let client: Rcon | undefined;

    try {
      client = await Rcon.connect({ host: creds.host, port: creds.port, password: creds.password, timeout: RCON_TEST_TIMEOUT_MS });
      return { ok: true, latency: Date.now() - started };
    } catch (error: any) {
      return { ok: false, error: error?.message || String(error) };
    } finally {
      if (client) {
        await client.end().catch(() => undefined);
      }
    }
  }

  invalidate(serverId: string): void {
    const client = this.connections.get(serverId);
    if (client) {
      client.end().catch(() => undefined);
      this.connections.delete(serverId);
    }
    this.connecting.delete(serverId);
  }

  async onModuleDestroy(): Promise<void> {
    for (const client of this.connections.values()) {
      await client.end().catch(() => undefined);
    }
    this.connections.clear();
  }
}
