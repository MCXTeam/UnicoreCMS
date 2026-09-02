import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { envConfig, PasswordContext, passwordIssue, passwordIssueCode } from 'unicore-common';
import { CacheKey, PWNED_CACHE_TTL_MS, PWNED_PADDING_HEADER, PWNED_TIMEOUT_MS } from '@common';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { pwnedCount, pwnedRange } from './pwned';

@Injectable()
export class PasswordPolicyService {
  private readonly logger = new Logger(PasswordPolicyService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async assert(password: string, context: PasswordContext = {}): Promise<void> {
    const issue = passwordIssue(password, { ...context, sitename: envConfig.sitename });

    if (issue) throw new BadRequestException(passwordIssueCode(issue));

    if (await this.breached(password)) throw new BadRequestException(passwordIssueCode('breached'));
  }

  private async enabled(): Promise<boolean> {
    const config = await this.configService.load();

    return Boolean(config[ConfigField.PasswordBreachCheck]);
  }

  private async range(prefix: string, url: string): Promise<string | null> {
    const key = `${CacheKey.PwnedRange}:${prefix}`;
    const cached = await this.cacheManager.get<string>(key);

    if (cached !== undefined && cached !== null) return cached;

    const response = await firstValueFrom(
      this.httpService.get<string>(url, {
        timeout: PWNED_TIMEOUT_MS,
        responseType: 'text',
        headers: { [PWNED_PADDING_HEADER]: 'true' },
      }),
    );

    const body = String(response.data ?? '');

    await this.cacheManager.set(key, body, PWNED_CACHE_TTL_MS);

    return body;
  }

  async breached(password: string): Promise<boolean> {
    if (!(await this.enabled())) return false;

    const { prefix, suffix, url } = pwnedRange(password);

    try {
      return pwnedCount(await this.range(prefix, url), suffix) > 0;
    } catch (e) {
      this.logger.warn(`Проверка пароля по базе утечек недоступна: ${e}`);

      return false;
    }
  }
}
