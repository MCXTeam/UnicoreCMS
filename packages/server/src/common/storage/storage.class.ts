import { existsSync, lstatSync, readFileSync, unlinkSync } from 'fs';
import { nanoid } from 'nanoid';
import { extname } from 'path';
import { DiskStorageOptions } from 'multer';
import { diskStorage } from 'multer';
import { Request } from 'express';

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
    return '/' + destination + '/' + filename;
  }

  /**
   * Удалить файл
   */
  static remove(filename?: string): void {
    if (!filename) return;

    const path = destination + '/' + filename;

    if (existsSync(path) && lstatSync(path).isFile()) unlinkSync(path);
  }

  static read(filename?: string): Buffer | null {
    if (!filename) return null;

    const path = destination + '/' + filename;

    if (existsSync(path) && lstatSync(path).isFile()) return readFileSync(path);
    else return null;
  }
}
