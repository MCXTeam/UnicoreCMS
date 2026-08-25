import { Injectable, Logger } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { adminPath, clientPath } from 'unicore-common';
import { formatError, REBUILD_BUILD_SCRIPT, REBUILD_LOG_LINES } from '@common';

export type RebuildSide = 'client' | 'admin';

export const REBUILD_SIDES: RebuildSide[] = ['client', 'admin'];

export interface RebuildState {
  running: boolean;
  side: RebuildSide | null;
  queue: RebuildSide[];
  startedAt: string | null;
  finishedAt: string | null;
  ok: boolean | null;
  error: string | null;
  log: string[];
}

const ROOTS: Record<RebuildSide, string> = { client: clientPath, admin: adminPath };

@Injectable()
export class RebuildService {
  private readonly logger = new Logger('Modules');

  private child: ChildProcess = null;

  private state: RebuildState = {
    running: false,
    side: null,
    queue: [],
    startedAt: null,
    finishedAt: null,
    ok: null,
    error: null,
    log: [],
  };

  status(): RebuildState {
    return { ...this.state, queue: [...this.state.queue], log: [...this.state.log] };
  }

  available(side: RebuildSide): boolean {
    return existsSync(join(ROOTS[side], REBUILD_BUILD_SCRIPT));
  }

  start(sides: RebuildSide[]): RebuildState {
    if (this.state.running) return this.status();

    const queue = REBUILD_SIDES.filter((side) => sides.includes(side) && this.available(side));

    this.state = {
      running: Boolean(queue.length),
      side: null,
      queue,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      ok: queue.length ? null : false,
      error: queue.length ? null : 'Не найден скрипт сборки фронтов',
      log: [],
    };

    if (queue.length) void this.next();

    return this.status();
  }

  stop(): RebuildState {
    if (this.child) {
      this.state.queue = [];
      this.child.kill('SIGTERM');
    }

    return this.status();
  }

  private write(line: string): void {
    for (const part of line.split(/\r?\n/)) {
      if (!part.trim()) continue;

      this.state.log.push(part);
    }

    if (this.state.log.length > REBUILD_LOG_LINES) this.state.log.splice(0, this.state.log.length - REBUILD_LOG_LINES);
  }

  private finish(ok: boolean, error?: string): void {
    this.child = null;
    this.state.running = false;
    this.state.side = null;
    this.state.finishedAt = new Date().toISOString();
    this.state.ok = ok;
    this.state.error = error || null;

    if (ok) this.logger.log('Пересборка фронтов завершена');
    else this.logger.warn(`Пересборка фронтов не удалась: ${error}`);
  }

  private async next(): Promise<void> {
    const side = this.state.queue.shift();

    if (!side) return this.finish(true);

    this.state.side = side;
    this.write(`=== Сборка ${side === 'client' ? 'клиента' : 'админки'} ===`);

    try {
      this.child = spawn(process.execPath, [REBUILD_BUILD_SCRIPT], { cwd: ROOTS[side], stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      return this.finish(false, formatError(error));
    }

    this.child.stdout.on('data', (chunk) => this.write(String(chunk)));
    this.child.stderr.on('data', (chunk) => this.write(String(chunk)));
    this.child.on('error', (error) => this.finish(false, formatError(error)));

    this.child.on('close', (status, signal) => {
      if (signal) return this.finish(false, `Сборка ${side} остановлена сигналом ${signal}`);
      if (status !== 0) return this.finish(false, `Сборка ${side} завершилась с кодом ${status}`);

      void this.next();
    });
  }
}
