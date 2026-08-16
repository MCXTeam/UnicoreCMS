import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, LessThan, Repository } from 'typeorm';
import { RconCommandStatus } from 'unicore-common';
import { RconCommand } from './entities/rcon-command.entity';
import { RconService } from './rcon.service';
import {
  KEEP_RCON_COMMANDS_DAYS,
  RCON_BACKOFF_BASE_MS,
  RCON_BACKOFF_MAX_MS,
  RCON_BATCH_LIMIT,
  RCON_MAX_ATTEMPTS,
  RCON_STALE_MS,
} from 'src/common/constants';

export interface EnqueueMeta {
  label?: string;
  kind?: string;
}

@Injectable()
export class RconQueueService {
  private readonly logger = new Logger('RconQueueService');
  private readonly worker = randomUUID();
  private processing = false;

  constructor(
    @InjectRepository(RconCommand) private readonly queueRepository: Repository<RconCommand>,
    private readonly rconService: RconService,
  ) {}

  enqueue(serverId: string, command: string, meta: EnqueueMeta = {}): Promise<RconCommand> {
    return this.queueRepository.save(this.build(serverId, command, meta));
  }

  enqueueMany(serverId: string, commands: string[], meta: EnqueueMeta = {}): Promise<RconCommand[]> {
    const items = commands.filter((command) => command.trim().length).map((command) => this.build(serverId, command, meta));
    if (!items.length) return Promise.resolve([]);
    return this.queueRepository.save(items);
  }

  private build(serverId: string, command: string, meta: EnqueueMeta): RconCommand {
    return this.queueRepository.create({
      serverId,
      command,
      label: meta.label,
      kind: meta.kind,
      status: RconCommandStatus.Pending,
      attempts: 0,
    });
  }

  private async releaseStale(): Promise<void> {
    await this.queueRepository
      .createQueryBuilder()
      .update()
      .set({ status: RconCommandStatus.Pending, worker: null })
      .where('status = :processing AND updated <= :deadline', {
        processing: RconCommandStatus.Processing,
        deadline: new Date(Date.now() - RCON_STALE_MS),
      })
      .execute();
  }

  private async claim(): Promise<RconCommand[]> {
    const claimed = await this.queueRepository
      .createQueryBuilder()
      .update()
      .set({ status: RconCommandStatus.Processing, worker: this.worker })
      .where('status = :pending AND (next_attempt IS NULL OR next_attempt <= :now)', {
        pending: RconCommandStatus.Pending,
        now: new Date(),
      })
      .limit(RCON_BATCH_LIMIT)
      .execute();

    if (!claimed.affected) return [];

    return this.queueRepository.find({
      where: { status: RconCommandStatus.Processing, worker: this.worker },
      order: { id: 'ASC' },
    });
  }

  private async release(items: RconCommand[]): Promise<void> {
    if (!items.length) return;

    await this.queueRepository.update(
      { id: In(items.map((item) => item.id)) },
      { status: RconCommandStatus.Pending, worker: null },
    );
  }

  async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      await this.releaseStale();

      const claimed = await this.claim();

      if (!claimed.length) return;

      const byServer = new Map<string, RconCommand[]>();
      for (const item of claimed) {
        const list = byServer.get(item.serverId) ?? [];
        list.push(item);
        byServer.set(item.serverId, list);
      }

      for (const [serverId, items] of byServer) {
        for (const [index, item] of items.entries()) {
          try {
            await this.rconService.sendCommand(serverId, item.command);

            item.status = RconCommandStatus.Sent;
            item.error = null;
            item.sentAt = new Date();
            item.worker = null;

            await this.queueRepository.save(item);
          } catch (error: any) {
            item.attempts += 1;
            item.error = error?.message || String(error);
            item.sentAt = null;
            item.worker = null;

            if (item.attempts >= RCON_MAX_ATTEMPTS) {
              item.status = RconCommandStatus.Failed;
              this.logger.warn(`RCON command #${item.id} for server ${serverId} failed permanently: ${item.error}`);
            } else {
              item.status = RconCommandStatus.Pending;
              const delay = Math.min(RCON_BACKOFF_BASE_MS * 2 ** (item.attempts - 1), RCON_BACKOFF_MAX_MS);
              item.nextAttempt = new Date(Date.now() + delay);
            }

            await this.queueRepository.save(item);
            this.rconService.invalidate(serverId);
            await this.release(items.slice(index + 1));
            break;
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  async retry(id: number): Promise<void> {
    await this.queueRepository.update(id, {
      status: RconCommandStatus.Pending,
      attempts: 0,
      nextAttempt: null,
      error: null,
    });
  }

  async retryFailed(serverId: string): Promise<void> {
    await this.queueRepository.update(
      { serverId, status: RconCommandStatus.Failed },
      { status: RconCommandStatus.Pending, attempts: 0, nextAttempt: null, error: null },
    );
  }

  async cleanup(days = KEEP_RCON_COMMANDS_DAYS): Promise<void> {
    if (days <= 0) return;

    const deadline = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    await this.queueRepository.delete({
      status: In([RconCommandStatus.Sent, RconCommandStatus.Failed]),
      created: LessThan(deadline),
    });
  }

  listByServer(serverId: string, limit = 100): Promise<RconCommand[]> {
    return this.queueRepository.find({
      where: { serverId },
      order: { id: 'DESC' },
      take: limit,
    });
  }
}
