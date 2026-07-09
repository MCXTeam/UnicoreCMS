import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { RconCommandStatus } from 'unicore-common';
import { RconCommand } from './entities/rcon-command.entity';
import { RconService } from './rcon.service';

const MAX_ATTEMPTS = 8;
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 30 * 60_000;
const BATCH_LIMIT = 200;

export interface EnqueueMeta {
  label?: string;
  kind?: string;
}

@Injectable()
export class RconQueueService {
  private readonly logger = new Logger('RconQueueService');
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

  async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const now = new Date();
      const pending = await this.queueRepository.find({
        where: [
          { status: RconCommandStatus.Pending, nextAttempt: IsNull() },
          { status: RconCommandStatus.Pending, nextAttempt: LessThanOrEqual(now) },
        ],
        order: { id: 'ASC' },
        take: BATCH_LIMIT,
      });

      if (!pending.length) return;

      const byServer = new Map<string, RconCommand[]>();
      for (const item of pending) {
        const list = byServer.get(item.serverId) ?? [];
        list.push(item);
        byServer.set(item.serverId, list);
      }

      for (const [serverId, items] of byServer) {
        let serverDown = false;

        for (const item of items) {
          if (serverDown) break;

          try {
            await this.rconService.sendCommand(serverId, item.command);
            item.status = RconCommandStatus.Sent;
            item.error = null;
            item.sentAt = new Date();
            await this.queueRepository.save(item);
          } catch (error: any) {
            serverDown = true;
            item.attempts += 1;
            item.error = error?.message || String(error);

            if (item.attempts >= MAX_ATTEMPTS) {
              item.status = RconCommandStatus.Failed;
              this.logger.warn(`RCON command #${item.id} for server ${serverId} failed permanently: ${item.error}`);
            } else {
              const delay = Math.min(BACKOFF_BASE_MS * 2 ** (item.attempts - 1), BACKOFF_MAX_MS);
              item.nextAttempt = new Date(Date.now() + delay);
            }

            await this.queueRepository.save(item);
            this.rconService.invalidate(serverId);
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

  listByServer(serverId: string, limit = 100): Promise<RconCommand[]> {
    return this.queueRepository.find({
      where: { serverId },
      order: { id: 'DESC' },
      take: limit,
    });
  }
}
