import {
  createReadStream,
  createWriteStream,
  existsSync,
  lstatSync,
  readFileSync,
  ReadStream,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { nanoid } from 'nanoid';
import { extname } from 'path';
import { DiskStorageOptions } from 'multer';
import { diskStorage } from 'multer';
import { Request } from 'express';
import axios from 'axios';
import { parse as urlParse } from 'url';
import { promises as dns } from 'dns';
import { isIP } from 'net';
import { Logger } from '@nestjs/common';
import { envConfig, storagePath } from 'unicore-common';
import { STORAGE_MAX_REMOTE_DOWNLOAD } from '../constants';
import { containedPath } from '../utils/path';

const destination = storagePath;

export class StorageManager {
  private static locate(filename?: string): string | null {
    return containedPath(destination, filename);
  }

  static fileName(req: Request, file: Express.Multer.File, callback) {
    callback(null, nanoid() + extname(file.originalname));
  }

  static disk(options?: DiskStorageOptions) {
    return diskStorage({
      destination,
      ...options,
      filename: this.fileName,
    });
  }

  static url(filename: string) {
    return envConfig.apiBaseurl + '/' + filename;
  }

  static path(filename: string): string | null {
    return StorageManager.locate(filename);
  }

  static remove(filename?: string): void {
    const path = StorageManager.locate(filename);

    if (path && existsSync(path) && lstatSync(path).isFile()) unlinkSync(path);
  }

  static save(origin: string, buffer: Buffer): string {
    const ext = extname(origin).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext) ? ext : '.png';
    const name = nanoid() + safeExt;

    writeFileSync(StorageManager.locate(name), buffer);

    return name;
  }

  static rename(filename: string): string {
    const path = StorageManager.locate(filename);

    if (!path || !existsSync(path) || !lstatSync(path).isFile()) return null;

    const newname = nanoid() + extname(filename);

    renameSync(path, StorageManager.locate(newname));

    return newname;
  }

  static async saveFromUrl(url: string): Promise<string> {
    if (!(await StorageManager.isSafeUrl(url))) {
      new Logger('StorageManager').error(`Blocked unsafe url: ${url}`);
      return null;
    }

    try {
      const filename = nanoid() + extname(urlParse(url).pathname);
      const save_path = StorageManager.locate(filename);

      const response = await axios.get(url, {
        responseType: 'stream',
        maxRedirects: 0,
        maxContentLength: STORAGE_MAX_REMOTE_DOWNLOAD,
        maxBodyLength: STORAGE_MAX_REMOTE_DOWNLOAD,
        timeout: 15000,
      });

      const contentLength = Number(response.headers['content-length']);
      if (!Number.isNaN(contentLength) && contentLength > STORAGE_MAX_REMOTE_DOWNLOAD) {
        response.data.destroy();
        return null;
      }

      const cleanup = () => {
        try {
          if (existsSync(save_path) && lstatSync(save_path).isFile()) unlinkSync(save_path);
        } catch {}
      };

      const writer = createWriteStream(save_path);
      let downloaded = 0;

      await new Promise<void>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          if (downloaded > STORAGE_MAX_REMOTE_DOWNLOAD) {
            response.data.destroy();
            writer.destroy();
            cleanup();
            reject(new Error('Downloaded file exceeds size limit'));
          }
        });
        response.data.on('error', (err: Error) => {
          cleanup();
          reject(err);
        });
        writer.on('error', (err: Error) => {
          cleanup();
          reject(err);
        });
        writer.on('finish', resolve);
        response.data.pipe(writer);
      });

      return filename;
    } catch (e) {
      const logger = new Logger('StorageManager');
      logger.error(e);
      return null;
    }
  }

  static async isSafeUrl(url: string): Promise<boolean> {
    let parsed: URL;

    try {
      parsed = new URL(url);
    } catch {
      return false;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
    if (!hostname) return false;

    try {
      const addresses = isIP(hostname) ? [{ address: hostname }] : await dns.lookup(hostname, { all: true });

      if (!addresses.length) return false;

      for (const { address } of addresses) {
        if (StorageManager.isPrivateAddress(address)) return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  private static isPrivateAddress(ip: string): boolean {
    const family = isIP(ip);

    if (family === 4) return StorageManager.isPrivateV4(ip);
    if (family === 6) return StorageManager.isPrivateV6(ip);

    return true;
  }

  private static isPrivateV4(ip: string): boolean {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

    const [a, b] = parts;

    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;

    return false;
  }

  private static isPrivateV6(ip: string): boolean {
    const lower = ip.toLowerCase();

    if (lower === '::' || lower === '::1') return true;

    const mapped = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mapped) return StorageManager.isPrivateV4(mapped[1]);

    const first = lower.split(':')[0];
    if (!first) return true;

    const fh = parseInt(first, 16);
    if (Number.isNaN(fh)) return true;

    if ((fh & 0xfe00) === 0xfc00) return true;
    if ((fh & 0xffc0) === 0xfe80) return true;

    return false;
  }

  static exists(filename?: string): boolean {
    const path = StorageManager.locate(filename);

    return Boolean(path) && existsSync(path) && lstatSync(path).isFile();
  }

  static read(filename?: string, maxBytes?: number): Buffer | null {
    if (!StorageManager.exists(filename)) return null;

    const path = StorageManager.locate(filename);

    if (typeof maxBytes === 'number' && lstatSync(path).size > maxBytes) return null;

    return readFileSync(path);
  }

  static readStream(filename?: string): ReadStream | null {
    return StorageManager.exists(filename) ? createReadStream(StorageManager.locate(filename)) : null;
  }
}
