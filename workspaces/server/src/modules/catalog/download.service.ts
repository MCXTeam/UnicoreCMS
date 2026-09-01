import { BadRequestException, Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { createHash } from 'crypto';
import { createWriteStream } from 'fs';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { API_VERSION } from 'unicore-api';
import {
  EXTENSION_DOWNLOAD_MAX_REDIRECTS,
  EXTENSION_DOWNLOAD_TIMEOUT_MS,
  formatError,
  GITHUB_TOKEN_HOSTS,
  STORAGE_MAX_ZIP_UPLOAD,
} from '@common';
import { StorageManager } from 'src/common/storage/storage.class';

export interface DownloadOptions {
  token?: string;
  tokenHosts?: string[];
  accept?: string;
  headers?: Record<string, string>;
}

export interface DownloadedArchive {
  filename: string;
  size: number;
  sha256: string;
}

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

@Injectable()
export class ExtensionDownloadService {
  async archive(url: string, options: DownloadOptions = {}): Promise<DownloadedArchive> {
    const response = await this.open(url, options);
    const declared = Number(response.headers['content-length']);

    if (Number.isFinite(declared) && declared > STORAGE_MAX_ZIP_UPLOAD) {
      response.data.destroy();
      throw new BadRequestException(`Архив больше допустимых ${Math.round(STORAGE_MAX_ZIP_UPLOAD / 1024 / 1024)} МБ`);
    }

    const filename = `${nanoid()}.zip`;
    const hash = createHash('sha256');
    const writer = createWriteStream(StorageManager.path(filename));
    let size = 0;

    try {
      await new Promise<void>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          size += chunk.length;

          if (size > STORAGE_MAX_ZIP_UPLOAD) {
            response.data.destroy(new Error('Архив превысил допустимый размер'));
            return;
          }

          hash.update(chunk);
        });
        response.data.on('error', reject);
        writer.on('error', reject);
        writer.on('finish', resolve);
        response.data.pipe(writer);
      });
    } catch (error) {
      writer.destroy();
      StorageManager.remove(filename);
      throw new BadRequestException(`Архив не скачан: ${formatError(error)}`);
    }

    return { filename, size, sha256: hash.digest('hex') };
  }

  async json<T>(url: string, options: DownloadOptions = {}, maxBytes: number): Promise<T> {
    const response = await this.open(url, { ...options, accept: options.accept || 'application/json' });
    const chunks: Buffer[] = [];
    let size = 0;

    await new Promise<void>((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        size += chunk.length;

        if (size > maxBytes) {
          response.data.destroy(new Error('Ответ больше допустимого размера'));
          return;
        }

        chunks.push(chunk);
      });
      response.data.on('error', reject);
      response.data.on('end', resolve);
    });

    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T;
    } catch {
      throw new BadRequestException('Ответ источника не является JSON');
    }
  }

  private async open(url: string, options: DownloadOptions): Promise<AxiosResponse<Readable>> {
    let current = url;

    for (let hop = 0; hop <= EXTENSION_DOWNLOAD_MAX_REDIRECTS; hop++) {
      if (!(await StorageManager.isSafeUrl(current))) throw new BadRequestException(`Адрес ${current} недоступен для скачивания`);

      const response = await axios
        .get<Readable>(current, {
          responseType: 'stream',
          maxRedirects: 0,
          timeout: EXTENSION_DOWNLOAD_TIMEOUT_MS,
          headers: this.headers(current, options),
          validateStatus: (status) => status < 400,
        })
        .catch((error) => {
          throw new BadRequestException(`Источник не ответил: ${this.describe(error)}`);
        });

      if (!REDIRECT_STATUSES.includes(response.status)) return response;

      response.data.destroy();

      const location = response.headers['location'];

      if (!location) throw new BadRequestException('Источник вернул перенаправление без адреса');

      current = new URL(String(location), current).href;
    }

    throw new BadRequestException('Слишком много перенаправлений');
  }

  private headers(url: string, options: DownloadOptions): Record<string, string> {
    const headers: Record<string, string> = {
      ...(options.headers || {}),
      'User-Agent': `UnicoreCMS/${API_VERSION}`,
      Accept: options.accept || 'application/octet-stream',
    };
    const hosts = options.tokenHosts || GITHUB_TOKEN_HOSTS;

    if (options.token && hosts.includes(new URL(url).hostname)) headers.Authorization = `Bearer ${options.token}`;

    return headers;
  }

  private describe(error: any): string {
    const status = error?.response?.status;

    if (status === 401 || status === 403) return `доступ запрещён (${status}), проверьте токен`;
    if (status === 404) return 'не найдено (404)';
    if (status) return `код ${status}`;

    return formatError(error);
  }
}
