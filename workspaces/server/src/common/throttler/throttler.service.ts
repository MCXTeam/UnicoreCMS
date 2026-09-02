import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheKey } from '../cache-key.enum';
import { SerialQueue } from '../utils/serial';

export interface ThrottleWindow {
  count: number;
  resetAt: number;
}

@Injectable()
export class ThrottlerService {
  private readonly queue = new SerialQueue();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private key(scope: string, tracker: string): string {
    return `${CacheKey.Throttle}:${scope}:${tracker}`;
  }

  async hit(scope: string, tracker: string, ttl: number): Promise<ThrottleWindow> {
    const key = this.key(scope, tracker);

    return this.queue.run(async () => {
      const now = Date.now();
      const current = await this.cacheManager.get<ThrottleWindow>(key);

      if (current && current.resetAt > now) {
        const next: ThrottleWindow = { count: current.count + 1, resetAt: current.resetAt };

        await this.cacheManager.set(key, next, current.resetAt - now);

        return next;
      }

      const fresh: ThrottleWindow = { count: 1, resetAt: now + ttl };

      await this.cacheManager.set(key, fresh, ttl);

      return fresh;
    });
  }
}
