import { createWriteStream, existsSync, lstatSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { nanoid } from 'nanoid';
import { extname } from 'path';
import { DiskStorageOptions } from 'multer';
import { diskStorage } from 'multer';
import { Request } from 'express';
import axios from 'axios';
import { parse as urlParse } from 'url';
import { Logger } from '@nestjs/common';
import { envConfig } from 'unicore-common';

const destination = '../../storage';

export class StorageManager {
  /**
   * Сгенерировать уникальное имя файла
   */
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

  /**
   * Получить url файла
   */
  static url(filename: string) {
    return envConfig.apiBaseurl + '/' + filename;
  }

  /**
   * Удалить файл
   */
  static remove(filename?: string): void {
    if (!filename) return;

    const path = destination + '/' + filename;

    if (existsSync(path) && lstatSync(path).isFile()) unlinkSync(path);
  }

  static async saveFromUrl(url: string): Promise<string> {
    try {
      const filename = nanoid() + extname(urlParse(url).pathname);
      const save_path = destination + '/' + filename;

      await axios
        .get(url, {
          responseType: 'stream',
        })
        .then(function (response) {
          response.data.pipe(createWriteStream(save_path));
        });

      return filename;
    } catch (e) {
      const logger = new Logger(StorageManager.name);
      logger.error(e);
      return null;
    }
  }

  static read(filename?: string): Buffer | null {
    if (!filename) return null;

    const path = destination + '/' + filename;

    if (existsSync(path) && lstatSync(path).isFile()) return readFileSync(path);
    else return null;
  }
}
